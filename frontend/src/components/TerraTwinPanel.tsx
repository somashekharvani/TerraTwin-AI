import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Eye, TrendingUp, Sparkles, CheckCircle2, ChevronRight, Activity, Leaf, ShieldAlert, Zap, Globe, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useEarthHealth } from "../context/EarthHealthContext";
import { DigitalEarth } from "./DigitalEarth";

interface TwinData {
  breakdown: {
    transport: number;
    energy: number;
    food: number;
    shopping: number;
    waste: number;
  };
  totalCarbonEmitted: number;
  projections: {
    baselineCurve: number[];
    recommendedCurve: number[];
    labels: string[];
    daysCount: number;
  };
  summary: {
    baselineTotal: number;
    optimizedTotal: number;
    potentialSavingsPercentage: number;
  };
}

const WhatIfSandbox: React.FC = () => {
  const [commutes, setCommutes] = useState(3);
  const [tempOffset, setTempOffset] = useState(2);

  // Commute savings: 1 commute/week ~ 14kg CO2 saved per month
  // Thermostat offset: 1°C shift ~ 8kg CO2 saved per month
  const commuteSavings = commutes * 14;
  const tempSavings = tempOffset * 8;
  const totalSavings = commuteSavings + tempSavings;

  return (
    <div id="what-if-sandbox" className="border-t border-white/5 pt-5 mt-5">
      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-3">
        <Activity className="w-3.5 h-3.5 text-ecoTeal" /> What-If Scenario Sandbox
      </div>
      <div className="space-y-4 bg-darkBg/20 border border-white/5 p-4 rounded-xl">
        {/* Commutes slider */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-gray-300">Walk/bike instead of drive:</span>
            <span className="text-white font-bold">{commutes}x / week</span>
          </div>
          <input
            type="range"
            min="0"
            max="7"
            value={commutes}
            onChange={(e) => setCommutes(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-ecoGreen"
          />
        </div>

        {/* Thermostat slider */}
        <div>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-gray-300">HVAC thermostat offset:</span>
            <span className="text-white font-bold">+{tempOffset}°C</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            value={tempOffset}
            onChange={(e) => setTempOffset(Number(e.target.value))}
            className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-ecoTeal"
          />
        </div>

        {/* Live outcome box */}
        <div className="bg-ecoGreen/5 border border-ecoGreen/10 p-3 rounded-lg flex items-center justify-between text-xs">
          <div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wider">Estimated Carbon Avoided</div>
            <p className="text-white font-black text-sm mt-0.5">
              Save <span className="text-ecoGreen-light">{totalSavings}kg</span> / month
            </p>
          </div>
          <div className="text-[9px] text-gray-400 text-right max-w-[50%] leading-normal font-medium">
            {`If you walk instead of drive ${commutes}x/week: save ${commuteSavings}kg/month`}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TerraTwinPanel: React.FC<{ token: string; refreshTrigger: number }> = ({ token, refreshTrigger }) => {
  const [data, setData] = useState<TwinData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { earthHealth, predictedHealth, optimizedHealth, adopted, adoptRecommendations } = useEarthHealth();
  const [animatedPredicted, setAnimatedPredicted] = useState(adopted ? 81 : 52);

  // Simulation states
  const [isSimulating, setIsSimulating] = useState(false);
  const [simStep, setSimStep] = useState(0); // 0 = idle, 1 = current, 2 = baseline risk, 3 = recovery
  const [simHealth, setSimHealth] = useState(earthHealth);

  const getAlertSeverity = (h: number) => {
    if (h < 50) return { label: "🚨 CRITICAL RISK DETECTED", color: "text-red-400", style: "bg-red-500/10 border-red-500/30 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]" };
    if (h <= 65) return { label: "⚠ WARNING OFFSET", color: "text-yellow-400", style: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.2)]" };
    if (h <= 80) return { label: "🌍 STABLE TRAJECTORY", color: "text-green-400", style: "bg-green-500/10 border-green-500/30 text-green-300 shadow-[0_0_15px_rgba(34,197,94,0.2)]" };
    return { label: "🌳 RECOVERY MODE SUCCESS", color: "text-emerald-400", style: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.35)]" };
  };

  const runSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimStep(1);
    setSimHealth(68);

    // Step 2: Baseline Future Risk after 1.8 seconds
    setTimeout(() => {
      setSimStep(2);
      setSimHealth(48);
    }, 1800);

    // Step 3: Optimized Future Recovery after 3.8 seconds
    setTimeout(() => {
      setSimStep(3);
      setSimHealth(81);
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
    }, 3800);

    // End simulation mode after 6.5 seconds
    setTimeout(() => {
      setIsSimulating(false);
      setSimStep(0);
      setSimHealth(earthHealth);
    }, 6500);
  };

  // Recommendations checked status
  const [recommendations, setRecommendations] = useState([
    { id: 1, text: "Commute by bus/metro instead of car tomorrow", savings: "5.4 kg CO₂", tokens: 100, completed: false },
    { id: 2, text: "Set AC thermostat 2°C warmer during peak hours", savings: "3.2 kg CO₂", tokens: 50, completed: false },
    { id: 3, text: "Replace steak with a low-carbon vegetarian meal", savings: "2.8 kg CO₂", tokens: 25, completed: false }
  ]);

  useEffect(() => {
    if (adopted && animatedPredicted < 81) {
      const duration = 1200; // ms
      const start = 52;
      const end = 81;
      const range = end - start;
      const startTime = performance.now();

      let animId: number;
      const step = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const currentVal = Math.round(start + progress * range);
        setAnimatedPredicted(currentVal);
        if (progress < 1) {
          animId = requestAnimationFrame(step);
        }
      };
      animId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(animId);
    } else if (!adopted) {
      setAnimatedPredicted(52);
    }
  }, [adopted]);

  const fetchTwinState = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/analytics/twin", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const resData = await response.json();
      if (!response.ok) throw new Error(resData.error);
      setData(resData);
    } catch (err: any) {
      setError(err.message || "Failed to load twin prediction");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTwinState();
  }, [token, refreshTrigger]);

  const handleCompleteRecommendation = (id: number, tokens: number) => {
    setRecommendations(prev =>
      prev.map(rec => (rec.id === id ? { ...rec, completed: true } : rec))
    );
    adoptRecommendations();
  };

  // Prepare chart data format
  const getChartData = () => {
    if (!data) return [];
    return data.projections.labels.map((label, index) => ({
      day: label,
      "Baseline Projection": Math.round(data.projections.baselineCurve[index]),
      "Optimized Trajectory": Math.round(data.projections.recommendedCurve[index])
    }));
  };

  return (
    <div className="p-6 rounded-2xl glass-glow border border-ecoGreen/10 flex flex-col justify-between h-full relative overflow-hidden">
      <div>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-ecoGreen/10 border border-ecoGreen/20 text-ecoGreen-light">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-tight">TerraTwin™ AI Predictor</h3>
              <p className="text-[10px] text-gray-400">See your carbon future before it happens</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-ecoGreen bg-ecoGreen/10 border border-ecoGreen/20 px-2.5 py-1 rounded-full font-bold">
            <Sparkles className="w-3.5 h-3.5" /> Predictor Active
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-ecoGreen border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center text-center p-6 border border-white/5 bg-white/5 rounded-xl">
            <ShieldAlert className="w-8 h-8 text-ecoRed mb-2" />
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Rotating SVG Earth Top Section */}
            <div className="flex flex-col md:flex-row items-center gap-6 bg-darkBg/30 border border-white/5 p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-ecoGreen/5 blur-2xl pointer-events-none rounded-full" />
              <div className="flex-shrink-0 relative">
                <DigitalEarth health={isSimulating ? simHealth : earthHealth} size={130} interactive />
                {(adopted || (isSimulating && simStep === 3)) && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute -top-1 -right-1 bg-ecoGreen text-darkBg p-1 rounded-full shadow-lg"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </motion.div>
                )}
              </div>
              <div className="flex-grow w-full">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    {isSimulating ? "🔴 Real-time Scenario Playback" : "Digital Twin Status"}
                  </span>
                  <span className="text-[10px] font-black text-ecoTeal-light bg-ecoTeal/10 px-2 py-0.5 rounded border border-ecoTeal/20">Active Projections</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {/* Current Card */}
                  <div className="bg-darkBg/60 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Current</span>
                    <span className="text-base font-black text-white flex items-center gap-1">
                      🌍 68%
                    </span>
                  </div>

                  {/* Predicted Card */}
                  <motion.div
                    animate={(adopted || (isSimulating && simStep === 3)) ? { borderColor: "rgba(16, 185, 129, 0.3)", scale: [1, 1.05, 1] } : {}}
                    className="bg-darkBg/60 border border-white/5 rounded-xl p-3 text-center flex flex-col items-center justify-center relative overflow-hidden"
                  >
                    {(adopted || (isSimulating && simStep === 3)) && <div className="absolute top-0 inset-x-0 h-0.5 bg-ecoGreen" />}
                    <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider mb-1">Predicted</span>
                    <span className="text-base font-black text-ecoGold flex items-center gap-1">
                      🌫 {isSimulating ? (simStep === 2 ? 48 : simStep === 3 ? 81 : 68) : animatedPredicted}%
                    </span>
                  </motion.div>

                  {/* Optimized Card */}
                  <div className="bg-ecoGreen/5 border border-ecoGreen/10 rounded-xl p-3 text-center flex flex-col items-center justify-center">
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-1 text-ecoGreen-light">Optimized</span>
                    <span className="text-base font-black text-ecoGreen-light flex items-center gap-1">
                      🌳 81%
                    </span>
                  </div>
                </div>

                {/* Simulation Control CTAs */}
                <div className="flex gap-2.5 mt-3">
                  <button
                    onClick={runSimulation}
                    disabled={isSimulating}
                    className={`flex-1 py-2 font-extrabold text-[10px] rounded-xl transition active:scale-95 shadow-md flex items-center justify-center gap-1 ${
                      isSimulating 
                        ? "bg-white/5 border border-white/5 text-gray-500 cursor-not-allowed" 
                        : "bg-gradient-to-r from-ecoTeal to-ecoGreen hover:from-ecoTeal-light hover:to-ecoGreen-light text-darkBg"
                    }`}
                  >
                    <Activity className="w-3.5 h-3.5" /> {isSimulating ? `Simulating Step ${simStep}...` : "Simulate My Future"}
                  </button>

                  {!adopted ? (
                    <button
                      onClick={() => adoptRecommendations()}
                      className="flex-grow py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-extrabold text-[10px] rounded-xl transition active:scale-95 flex items-center justify-center gap-1"
                    >
                      <Sparkles className="w-3 h-3 text-ecoGreen-light" /> Adopt AI Recommendations
                    </button>
                  ) : (
                    <div className="flex-grow py-2 bg-ecoGreen/10 border border-ecoGreen/20 text-ecoGreen-light text-center text-[10px] font-black rounded-xl flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Trajectory Adopted
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Earth Emergency Alert Card */}
            <AnimatePresence>
              {isSimulating && simStep > 1 && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: -10 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: -10 }}
                  className={`p-4 rounded-xl border flex flex-col gap-2 relative overflow-hidden ${getAlertSeverity(simHealth).style}`}
                >
                  <div className="flex justify-between items-center pb-1.5 border-b border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {simStep === 2 ? "🚨 EARTH ALERT" : "🌳 RECOVERY MODE"}
                    </span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-black/30 font-bold uppercase text-white">Simulation mode</span>
                  </div>

                  {simStep === 2 && (
                    <div className="space-y-1.5 text-left">
                      <p className="text-xs font-black text-white">Projected Health: 48%</p>
                      <div className="text-[11px] font-bold text-red-400 mt-2 space-y-1">
                        <p className="flex items-center gap-1.5">🚗 Transportation Risk ↑</p>
                        <p className="flex items-center gap-1.5">🍎 Food Waste ↑</p>
                        <p className="flex items-center gap-1.5">⚡ Energy Consumption ↑</p>
                      </div>
                    </div>
                  )}

                  {simStep === 3 && (
                    <div className="space-y-1.5 text-left">
                      <p className="text-xs font-black text-white">Recovery Successful</p>
                      <p className="text-[10px] text-emerald-300/95 mt-1 leading-normal font-medium">
                        Carbon mitigation successfully deployed. Transitioning your commute to public transit, optimizing utility scanner targets, and activating Gemini EcoBot recommendations offsets future risks.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>


            {/* AI Insight Box */}
            <div className="bg-ecoGreen/5 border border-ecoGreen/15 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-ecoGreen/10 border border-ecoGreen/25 rounded-lg text-ecoGreen-light mt-0.5 flex-shrink-0">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="flex-grow">
                <div className="text-[10px] font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                  🤖 TerraTwin Insight
                </div>
                <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                  Your carbon footprint is projected to increase by <span className="text-ecoGold font-bold">25%</span> this month.
                  Switching to public transport twice a week could reduce emissions by <span className="text-ecoGreen-light font-bold">18%</span>.
                </p>
              </div>
            </div>


            {/* Trajectory comparison chart */}
            <div className="h-44 w-full bg-darkBg/40 border border-white/5 rounded-2xl p-2.5">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={getChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#151c23", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff", fontSize: "10px", fontWeight: "bold" }}
                    itemStyle={{ fontSize: "10px" }}
                  />
                  <Legend verticalAlign="top" height={24} iconSize={8} wrapperStyle={{ fontSize: "9px" }} />
                  <Line type="monotone" dataKey="Baseline Projection" stroke="#f59e0b" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="Optimized Trajectory" stroke="#10b981" strokeWidth={2.5} strokeDasharray="3 3" dot={false} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Interactive Recommendations */}
            <div>
              <div className="flex items-center gap-1 text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2.5">
                <TrendingUp className="w-3.5 h-3.5 text-ecoGreen" /> Recommended Twin Adjustments
              </div>
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className={`flex justify-between items-center bg-darkBg/30 border border-white/5 p-2.5 rounded-xl transition ${rec.completed ? "opacity-40" : "hover:border-ecoGreen/30"}`}
                  >
                    <div className="flex gap-2.5 items-start max-w-[70%]">
                      <Leaf className={`w-4 h-4 mt-0.5 flex-shrink-0 ${rec.completed ? "text-gray-500" : "text-ecoGreen-light"}`} />
                      <div>
                        <div className="text-xs text-white font-medium">{rec.text}</div>
                        <div className="text-[9px] text-gray-400 mt-0.5 flex gap-2">
                          <span>Saves {rec.savings}</span>
                          <span className="text-ecoTeal-light font-semibold">+{rec.tokens} ECO</span>
                        </div>
                      </div>
                    </div>
                    {!rec.completed ? (
                      <button
                        onClick={() => handleCompleteRecommendation(rec.id, rec.tokens)}
                        className="bg-ecoGreen hover:bg-ecoGreen-light text-darkBg text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition active:scale-95 flex-shrink-0"
                      >
                        Adopt
                      </button>
                    ) : (
                      <span className="text-[10px] text-ecoGreen font-bold flex items-center gap-0.5 flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> Adopted
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* What-If Sandbox Section */}
            <WhatIfSandbox />

            {/* Carbon Impact Equivalence Section */}
            <div className="bg-darkBg/30 border border-white/5 p-4 rounded-xl space-y-3 mt-4">
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5 text-ecoTeal" /> Carbon Impact Equivalence
              </div>
              
              <div className="flex gap-4 items-baseline">
                <div className="text-xl font-black text-white">291 <span className="text-[10px] text-gray-400 font-medium">kWh</span></div>
                <div className="text-xl font-black text-ecoTeal-light">67.8 <span className="text-[10px] text-gray-400 font-medium">kg CO₂</span></div>
              </div>
              
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Equivalent to:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2 bg-darkBg/60 border border-white/5 p-2 rounded-lg">
                  <span className="text-base">🚗</span>
                  <span className="text-gray-300">Driving 280 km</span>
                </div>
                <div className="flex items-center gap-2 bg-darkBg/60 border border-white/5 p-2 rounded-lg">
                  <span className="text-base">🌳</span>
                  <span className="text-gray-300">3 Trees needed to offset</span>
                </div>
                <div className="flex items-center gap-2 bg-darkBg/60 border border-white/5 p-2 rounded-lg">
                  <span className="text-base">📱</span>
                  <span className="text-gray-300">Charging 8,000 phones</span>
                </div>
                <div className="flex items-center gap-2 bg-darkBg/60 border border-white/5 p-2 rounded-lg">
                  <span className="text-base">💡</span>
                  <span className="text-gray-300">Running a 10W LED for 280 days</span>
                </div>
                <div className="flex items-center gap-2 bg-darkBg/60 border border-white/5 p-2 rounded-lg md:col-span-2">
                  <span className="text-base">🏠</span>
                  <span className="text-gray-300">Powering an average home for 2 days</span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>

  );
};
