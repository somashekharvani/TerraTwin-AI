import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Navigation, Milestone, Compass, Activity, ShieldAlert, BadgeAlert, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEarthHealth } from "../context/EarthHealthContext";

interface TripTrackerProps {
  token: string;
  onTripLogged: () => void;
}

export const TripTracker: React.FC<TripTrackerProps> = ({ token, onTripLogged }) => {
  const [isActive, setIsActive] = useState(false);
  const { logTrip } = useEarthHealth();
  const [mode, setMode] = useState<"auto" | "walking" | "bike" | "bus" | "car" | "train">("auto");
  const [simulatedMode, setSimulatedMode] = useState<"walking" | "bike" | "bus" | "car" | "train">("car");
  const [isSimulator, setIsSimulator] = useState(true); // Default to simulator for easy browser testing

  // Trip stats
  const [distance, setDistance] = useState(0); // in km
  const [duration, setDuration] = useState(0); // in seconds
  const [speed, setSpeed] = useState(0); // in km/h
  const [carbon, setCarbon] = useState(0); // in kg CO2
  const [confidence, setConfidence] = useState(98); // Transport is 98% confidence
  const [locationsLogged, setLocationsLogged] = useState<{ lat: number; lng: number }[]>([]);

  // Refs and timers
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // Carbon factors
  const factors = {
    walking: 0,
    bike: 0,
    bus: 0.11,
    car: 0.21,
    train: 0.04
  };

  // Speed-based auto-detection
  const getDetectedMode = (currentSpeed: number): "walking" | "bike" | "bus" | "car" | "train" => {
    if (currentSpeed > 40) return "car";
    if (currentSpeed >= 20) return "bike";
    if (currentSpeed >= 10) return "bus";
    return "walking";
  };

  // Live carbon update
  useEffect(() => {
    const currentMode = mode === "auto" ? getDetectedMode(speed) : mode;
    const factor = factors[currentMode as keyof typeof factors] || 0;
    setCarbon(Math.round((distance * factor) * 100) / 100);
  }, [distance, speed, mode]);

  // Start Trip
  const handleStartTrip = () => {
    setIsActive(true);
    setDistance(0);
    setDuration(0);
    setSpeed(0);
    setCarbon(0);
    setLocationsLogged([]);
    startTimeRef.current = Date.now();

    // Start timer
    timerRef.current = setInterval(() => {
      setDuration(prev => prev + 1);
    }, 1000);

    if (isSimulator) {
      // Simulation mode
      // Start location updates
      let baseLat = 37.7749;
      let baseLng = -122.4194;
      setLocationsLogged([{ lat: baseLat, lng: baseLng }]);
    } else {
      // Real Geolocation
      if ("geolocation" in navigator) {
        watchIdRef.current = navigator.geolocation.watchPosition(
          async (position) => {
            const { latitude, longitude, speed: gpsSpeed } = position.coords;
            
            // Log coordinate to backend
            try {
              await fetch("http://localhost:5000/api/track/location", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ latitude, longitude })
              });
            } catch (err) {
              console.error("Failed to log intermediate location:", err);
            }

            setLocationsLogged(prev => [...prev, { lat: latitude, lng: longitude }]);

            // Calculate metrics if we have at least 2 points
            setLocationsLogged(currentLocs => {
              if (currentLocs.length > 1) {
                const p1 = currentLocs[currentLocs.length - 2];
                const p2 = currentLocs[currentLocs.length - 1];
                
                // Haversine formula for distance
                const R = 6371; // km
                const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
                const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
                const a =
                  Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos((p1.lat * Math.PI) / 180) *
                    Math.cos((p2.lat * Math.PI) / 180) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
                const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
                const dist = R * c;

                setDistance(prev => Math.round((prev + dist) * 100) / 100);
              }
              return currentLocs;
            });

            // Convert m/s to km/h
            if (gpsSpeed !== null && gpsSpeed !== undefined) {
              setSpeed(Math.round((gpsSpeed * 3.6) * 10) / 10);
            }
          },
          (error) => {
            console.error("Geolocation watch error:", error);
            alert("Geolocation error: Using simulator fallback.");
            setIsSimulator(true);
          },
          { enableHighAccuracy: true }
        );
      } else {
        alert("Geolocation not supported. Running in simulation mode.");
        setIsSimulator(true);
      }
    }
  };

  // Simulation controls (adds distance/speed manually)
  const addSimulatedDistance = (km: number) => {
    if (!isActive) return;
    
    // Determine speed based on mode selected
    let simulatedSpeed = 5;
    if (simulatedMode === "bike") simulatedSpeed = 22;
    else if (simulatedMode === "bus") simulatedSpeed = 15;
    else if (simulatedMode === "car") simulatedSpeed = 65;
    else if (simulatedMode === "train") simulatedSpeed = 110;

    setSpeed(simulatedSpeed);
    setDistance(prev => Math.round((prev + km) * 100) / 100);

    // Mock coordinate path shift slightly
    setLocationsLogged(prev => {
      const last = prev[prev.length - 1] || { lat: 37.7749, lng: -122.4194 };
      const offset = km / 111; // 1 degree lat is ~111km
      return [...prev, { lat: last.lat + offset * (Math.random() - 0.2), lng: last.lng + offset * (Math.random() - 0.2) }];
    });
  };

  // End Trip & Save to DB
  const handleEndTrip = async () => {
    setIsActive(false);

    if (timerRef.current) clearInterval(timerRef.current);
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);

    const tripMode = mode === "auto" ? getDetectedMode(speed) : mode;
    const finalMode = isSimulator ? simulatedMode : tripMode;

    try {
      const response = await fetch("http://localhost:5000/api/track/commute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          distanceKm: distance,
          durationSeconds: duration,
          averageSpeedKmh: speed || 20, // default if stationary
          mode: finalMode
        })
      });

      if (!response.ok) {
        throw new Error("Failed to save trip");
      }

      let mappedMode: "car" | "bus" | "walk" = "walk";
      if (finalMode === "car") mappedMode = "car";
      else if (finalMode === "bus" || finalMode === "train") mappedMode = "bus";
      logTrip(mappedMode);

      onTripLogged();
      alert(`Trip logged! Mode: ${finalMode.toUpperCase()}. Carbon: ${carbon} kg CO₂. EcoTokens awarded! 🎉`);

    } catch (err) {
      console.error(err);
      alert("Failed to record trip to server.");
    }
  };

  // Format time (mm:ss)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  return (
    <div className="p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-full relative overflow-hidden">
      {/* Title */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5 text-ecoGreen" />
            <h3 className="text-lg font-bold text-white leading-tight">Active Trip Tracker</h3>
          </div>
          {/* Toggle Geolocation vs Simulator */}
          <div className="flex bg-darkBg/60 border border-white/5 p-0.5 rounded-lg text-[10px]">
            <button
              onClick={() => !isActive && setIsSimulator(false)}
              disabled={isActive}
              className={`px-2 py-1 rounded-md transition font-medium ${!isSimulator ? "bg-ecoGreen text-darkBg" : "text-gray-400 hover:text-white"}`}
            >
              GPS
            </button>
            <button
              onClick={() => !isActive && setIsSimulator(true)}
              disabled={isActive}
              className={`px-2 py-1 rounded-md transition font-medium ${isSimulator ? "bg-ecoGreen text-darkBg" : "text-gray-400 hover:text-white"}`}
            >
              SIM
            </button>
          </div>
        </div>

        {/* Mode Selector */}
        {!isActive && (
          <div className="mb-4">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
              Select Trip Mode
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setMode("auto")}
                className={`py-1.5 px-3 rounded-lg border text-xs font-semibold transition ${mode === "auto" ? "bg-ecoGreen/10 border-ecoGreen text-ecoGreen-light" : "bg-darkBg/20 border-white/5 text-gray-400"}`}
              >
                Auto-Detect
              </button>
              {isSimulator ? (
                // In simulator, lock to these modes directly
                <select
                  value={simulatedMode}
                  onChange={(e) => setSimulatedMode(e.target.value as any)}
                  className="col-span-2 bg-darkBg/60 border border-white/5 rounded-lg px-2 text-xs text-white"
                >
                  <option value="car">Drive Car (0.21 kg/km)</option>
                  <option value="bus">Ride Bus (0.11 kg/km)</option>
                  <option value="train">Ride Train (0.04 kg/km)</option>
                  <option value="bike">Ride Bike (0.00 kg/km)</option>
                  <option value="walking">Walk (0.00 kg/km)</option>
                </select>
              ) : (
                // In GPS mode, select constraint
                <div className="col-span-2 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setMode("car")}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition ${mode === "car" ? "bg-ecoGreen/10 border-ecoGreen text-ecoGreen-light" : "bg-darkBg/20 border-white/5 text-gray-400"}`}
                  >
                    Car
                  </button>
                  <button
                    onClick={() => setMode("bus")}
                    className={`py-1.5 rounded-lg border text-xs font-semibold transition ${mode === "bus" ? "bg-ecoGreen/10 border-ecoGreen text-ecoGreen-light" : "bg-darkBg/20 border-white/5 text-gray-400"}`}
                  >
                    Bus
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Stats Display */}
      <div className="my-4 bg-darkBg/50 border border-white/5 rounded-2xl p-4 flex flex-col relative overflow-hidden">
        {isActive && (
          <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest">Active</span>
          </div>
        )}

        <div className="flex justify-between items-baseline mb-3">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Estimated Carbon</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] bg-ecoGreen/10 border border-ecoGreen/20 px-2 py-0.5 rounded text-ecoGreen-light font-bold">
              {confidence}% Confidence
            </span>
          </div>
        </div>

        <div className="text-4xl font-black text-white tracking-tight flex items-baseline gap-1.5 mb-4">
          {carbon.toFixed(2)}
          <span className="text-base text-gray-400 font-medium">kg CO₂</span>
        </div>

        <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-3 text-center">
          <div>
            <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-0.5">
              <Milestone className="w-3.5 h-3.5" /> Distance
            </div>
            <div className="text-base font-bold text-white">{distance.toFixed(2)} <span className="text-[10px] text-gray-400 font-medium">km</span></div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-0.5">
              <Compass className="w-3.5 h-3.5" /> Speed
            </div>
            <div className="text-base font-bold text-white">{speed.toFixed(1)} <span className="text-[10px] text-gray-400 font-medium">km/h</span></div>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 flex items-center justify-center gap-1 mb-0.5">
              <Activity className="w-3.5 h-3.5" /> Duration
            </div>
            <div className="text-base font-bold text-white">{formatTime(duration)}</div>
          </div>
        </div>
      </div>

      {/* Geolocation visual path audit (crumbs logged) */}
      {isActive && locationsLogged.length > 0 && (
        <div className="mb-4 bg-darkBg/30 border border-white/5 rounded-xl p-2.5 flex items-center justify-between text-[10px] text-gray-400">
          <span>GPS Audit Path: {locationsLogged.length} coords</span>
          <span className="font-mono text-[9px] text-gray-500">
            [{locationsLogged[locationsLogged.length - 1].lat.toFixed(4)}, {locationsLogged[locationsLogged.length - 1].lng.toFixed(4)}]
          </span>
        </div>
      )}

      {/* Simulation Increment buttons */}
      {isActive && isSimulator && (
        <div className="mb-4 bg-ecoTeal/5 border border-ecoTeal/10 p-3 rounded-xl">
          <span className="text-[9px] text-ecoTeal-light font-bold uppercase tracking-wider block mb-2">
            Simulate Movement (Speed: {simulatedMode.toUpperCase()})
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => addSimulatedDistance(0.5)}
              className="py-1 rounded bg-ecoTeal/10 hover:bg-ecoTeal/20 text-[10px] text-ecoTeal-light border border-ecoTeal/20 font-bold transition"
            >
              +0.5 km
            </button>
            <button
              onClick={() => addSimulatedDistance(2.0)}
              className="py-1 rounded bg-ecoTeal/10 hover:bg-ecoTeal/20 text-[10px] text-ecoTeal-light border border-ecoTeal/20 font-bold transition"
            >
              +2.0 km
            </button>
            <button
              onClick={() => addSimulatedDistance(5.0)}
              className="py-1 rounded bg-ecoTeal/10 hover:bg-ecoTeal/20 text-[10px] text-ecoTeal-light border border-ecoTeal/20 font-bold transition"
            >
              +5.0 km
            </button>
          </div>
        </div>
      )}

      {/* Start / Stop action */}
      <div>
        {!isActive ? (
          <button
            onClick={handleStartTrip}
            className="w-full bg-gradient-to-r from-ecoGreen to-ecoGreen-dark hover:from-ecoGreen-light hover:to-ecoGreen text-darkBg font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-ecoGreen/10 transition active:scale-95"
          >
            <Play className="w-4 h-4 fill-darkBg" />
            Start Commute
          </button>
        ) : (
          <button
            onClick={handleEndTrip}
            className="w-full bg-ecoRed hover:bg-ecoRed/90 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-ecoRed/10 transition active:scale-95 animate-pulse"
          >
            <Square className="w-4 h-4 fill-white" />
            End Commute & Log
          </button>
        )}
      </div>
    </div>
  );
};
