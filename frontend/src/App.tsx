import React, { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { Dashboard } from "./components/Dashboard";
import { TerraTwinPanel } from "./components/TerraTwinPanel";
import { AICamera } from "./components/AICamera";
import { TripTracker } from "./components/TripTracker";
import { EcoAgent } from "./components/EcoAgent";
import { CarbonStory } from "./components/CarbonStory";
import { PrivacyDashboard } from "./components/PrivacyDashboard";
import { LeaderboardConsole } from "./components/LeaderboardConsole";
import { LayoutDashboard, Eye, Camera, Navigation, MessageSquare, Sparkles, Shield, LogOut, Moon, Sun, UserPlus, LogIn, Leaf, Trophy, TrendingUp, Sparkle, CornerDownLeft, Cpu, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EarthHealthProvider, useEarthHealth } from "./context/EarthHealthContext";
import { DigitalEarth } from "./components/DigitalEarth";

const SparklineTrend: React.FC<{ data: number[] }> = ({ data }) => {
  if (data.length === 0) return null;
  const width = 160;
  const height = 24;
  const padding = 3;
  const maxVal = 100;
  const minVal = 0;
  
  const points = data.map((val, idx) => {
    const x = padding + (idx * (width - padding * 2)) / (data.length - 1 || 1);
    const y = height - padding - ((val - minVal) * (height - padding * 2)) / (maxVal - minVal || 1);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width="100%" height={height} className="overflow-visible mt-1">
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      {data.map((val, idx) => {
        const x = padding + (idx * (width - padding * 2)) / (data.length - 1 || 1);
        const y = height - padding - ((val - minVal) * (height - padding * 2)) / (maxVal - minVal || 1);
        const isLast = idx === data.length - 1;
        return (
          <circle
            key={idx}
            cx={x}
            cy={y}
            r={isLast ? 3.5 : 1.5}
            fill={isLast ? "#10b981" : "#4b5563"}
            className={isLast ? "animate-pulse" : ""}
          />
        );
      })}
    </svg>
  );
};

const getProgressionInfo = (health: number) => {
  if (health <= 30) {
    return {
      level: "🔥 Critical",
      next: "🌫 Recovering",
      min: 0,
      max: 31,
      progress: Math.round((health / 30) * 100)
    };
  } else if (health <= 50) {
    return {
      level: "🌫 Recovering",
      next: "🌍 Stable",
      min: 31,
      max: 51,
      progress: Math.round(((health - 31) / 19) * 100)
    };
  } else if (health <= 75) {
    return {
      level: "🌍 Stable",
      next: "🌳 Thriving",
      min: 51,
      max: 76,
      progress: Math.round(((health - 51) / 24) * 100)
    };
  } else if (health <= 90) {
    return {
      level: "🌳 Thriving",
      next: "🌟 Regenerative",
      min: 76,
      max: 91,
      progress: Math.round(((health - 76) / 14) * 100)
    };
  } else {
    return {
      level: "🌟 Regenerative",
      next: "Max Level Reached",
      min: 91,
      max: 100,
      progress: 100
    };
  }
};

const AppContent: React.FC = () => {

  const { isAuthenticated, user, token, login, signup, logout, loading } = useAuth();
  const { 
    earthHealth, 
    predictedHealth, 
    optimizedHealth, 
    totalCarbon, 
    userRank, 
    todayActions, 
    healthHistory 
  } = useEarthHealth();
  const [activeTab, setActiveTab] = useState<"dashboard" | "twin" | "camera" | "commute" | "bot" | "story" | "privacy" | "leaderboard">("dashboard");
  const [theme, setTheme] = useState<"dark" | "light">(() => (localStorage.getItem("terratwin_theme") as "dark" | "light") || "dark");

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
    localStorage.setItem("terratwin_theme", theme);
  }, [theme]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const screenshot = urlParams.get("screenshot");
    if (screenshot) {
      if (screenshot === "landing") {
        setShowLanding(true);
      } else {
        setShowLanding(false);
        if (["dashboard", "twin", "camera", "commute", "bot", "story", "privacy", "leaderboard"].includes(screenshot)) {
          setActiveTab(screenshot as any);
        }
      }

      const scrollTarget = urlParams.get("scroll");
      if (scrollTarget) {
        setTimeout(() => {
          const element = document.getElementById(scrollTarget);
          if (element) {
            element.scrollIntoView({ block: "center" });
          } else {
            window.scrollTo(0, document.body.scrollHeight);
          }
        }, 1500);
      }
    }
  }, [activeTab]);

  // Local component refresh states
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // PWA installation state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User prompt choice: ${outcome}`);
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  // Login/Signup form states
  const [showLanding, setShowLanding] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authGoal, setAuthGoal] = useState(600); // 600 kg limit
  const [authError, setAuthError] = useState("");

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      if (isRegistering) {
        if (!authName || !authEmail || !authPassword) {
          setAuthError("Please fill out all registration fields.");
          return;
        }
        await signup(authName, authEmail, authPassword, Number(authGoal));
      } else {
        if (!authEmail || !authPassword) {
          setAuthError("Email and password are required.");
          return;
        }
        await login(authEmail, authPassword);
      }
    } catch (err: any) {
      setAuthError(err.message || "Authentication failed. Try again.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-ecoGreen border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (showLanding) {
      return (
        <div className="min-h-screen bg-darkBg text-white overflow-y-auto selection:bg-ecoGreen/30 relative">
          {/* Animated Glowing blobs */}
          <div className="absolute top-10 left-10 w-96 h-96 bg-ecoGreen/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-ecoTeal/10 rounded-full blur-3xl animate-pulse [animation-delay:2.5s] pointer-events-none" />

          {/* Floating Navbar */}
          <header className="sticky top-0 z-50 glass border-b border-white/5 px-6 py-4 flex justify-between items-center backdrop-blur-md">
            <div className="flex items-center gap-2">
              <Leaf className="w-6 h-6 text-ecoGreen-light" />
              <span className="text-xl font-black tracking-wider text-white">TerraTwin <span className="text-ecoGreen-light">AI</span></span>
            </div>
            <button
              onClick={() => setShowLanding(false)}
              className="px-5 py-2 bg-gradient-to-r from-ecoGreen to-ecoTeal hover:from-ecoGreen-light hover:to-ecoTeal-light text-darkBg font-black text-xs rounded-xl shadow-lg shadow-ecoGreen/10 hover:shadow-ecoGreen/20 transition-all duration-300 flex items-center gap-1.5 active:scale-95"
            >
              Launch App
            </button>
          </header>

          {/* Section 1 — Hero */}
          <section className="py-16 md:py-24 px-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Hero Text */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ecoGreen/10 border border-ecoGreen/25 text-ecoGreen-light text-xs font-black uppercase tracking-wider">
                  <Leaf className="w-3.5 h-3.5 animate-bounce" /> Digital Twin Platform
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight text-white leading-none">
                  TerraTwin AI
                </h1>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
                  See your carbon future before it happens.
                </h2>
                <p className="text-base text-gray-300 font-medium leading-relaxed max-w-xl">
                  AI-powered Digital Carbon Twin that predicts future emissions and recommends actions before they happen.
                </p>
              </div>

              <div className="pt-4">
                <button
                  onClick={() => setShowLanding(false)}
                  className="px-10 py-4 bg-gradient-to-r from-ecoGreen to-ecoTeal hover:from-ecoGreen-light hover:to-ecoTeal-light text-darkBg font-black text-sm rounded-2xl shadow-xl shadow-ecoGreen/10 hover:shadow-ecoGreen/30 active:scale-95 transition-all duration-300 flex items-center gap-2 group"
                >
                  Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>

            {/* Right Column: High-Impact Dashboard Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-6 rounded-2xl bg-[#091117]/80 border border-white/5 shadow-2xl relative overflow-hidden flex flex-col gap-4 text-left">
                {/* Glow overlay */}
                <div className="absolute -top-12 -right-12 w-36 h-36 bg-ecoGreen/15 blur-2xl rounded-full" />
                
                {/* Header */}
                <div className="flex justify-between items-center pb-2.5 border-b border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-ecoGreen animate-ping" />
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Live Twin Simulator</span>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-ecoGreen/10 border border-ecoGreen/20 text-ecoGreen-light font-black uppercase">
                    🌍 Earth Health: 73%
                  </span>
                </div>

                {/* Rotating 3D Digital Twin Earth preview */}
                <div className="py-4 flex justify-center bg-darkBg/30 rounded-xl border border-white/5 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-ecoGreen/5 to-ecoTeal/5 blur-sm" />
                  <DigitalEarth health={73} size={110} interactive />
                </div>

                {/* Level Display */}
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-300 font-bold">Current Level</span>
                  <span className="text-xs px-2.5 py-1 rounded bg-teal-500/10 border border-teal-500/30 text-teal-400 font-black flex items-center gap-1">
                    🌍 Stable
                  </span>
                </div>

                {/* Risk Gauge */}
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-300 font-bold">Future Risk Status</span>
                  <span className="font-extrabold text-yellow-300 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded">
                    🟡 Medium Risk
                  </span>
                </div>

                {/* Scenario Cards Grid */}
                <div className="grid grid-cols-3 gap-2 py-1">
                  <div className="bg-darkBg/60 border border-white/5 p-2 rounded-xl text-center">
                    <span className="text-[8px] text-gray-500 block">Current</span>
                    <span className="text-xs font-black text-white mt-0.5 block">🌍 73%</span>
                  </div>
                  <div className="bg-darkBg/60 border border-white/5 p-2 rounded-xl text-center">
                    <span className="text-[8px] text-gray-500 block">Predicted</span>
                    <span className="text-xs font-black text-orange-400 mt-0.5 block">🌫 52%</span>
                  </div>
                  <div className="bg-darkBg/60 border border-white/5 p-2 rounded-xl text-center">
                    <span className="text-[8px] text-gray-500 block">Optimized</span>
                    <span className="text-xs font-black text-ecoGreen mt-0.5 block">🌳 81%</span>
                  </div>
                </div>

                {/* Carbon Equivalents Box */}
                <div className="bg-gradient-to-br from-[#0e171f] to-darkBg border border-[#2a3e52]/30 p-3 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-white font-black">
                    <span>CO₂ Saved / Month</span>
                    <span className="text-ecoGreen-light font-mono font-black text-xs">68.8 kg</span>
                  </div>
                  <div className="h-[1px] bg-white/5" />
                  <div className="space-y-1 text-[9px] text-gray-400">
                    <div className="flex items-center gap-2">
                      <span>🌳</span>
                      <span>Equivalent to planting <strong>3 Trees</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>🚗</span>
                      <span>Avoiding <strong>280 km</strong> of driving</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2 — Your Existing 4 Cards */}
          <section className="py-16 bg-white/2 border-y border-white/5">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-black text-white">Interactive Twin Capabilities</h2>
                <p className="text-sm text-gray-400 mt-2">Real-time simulation layers mapping your lifestyle directly onto the planetary twin.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { emoji: "📷", title: "Scan Bills", desc: "Automated OCR footprint parsing & utility tracking." },
                  { emoji: "🍔", title: "Analyze Meals", desc: "Gemini vision food emissions & grocery mapping." },
                  { emoji: "🚗", title: "Track Trips", desc: "Active travel GPS calculator & commute analysis." },
                  { emoji: "🌍", title: "Improve Earth Health", desc: "Living digital planet simulator with action layers." },
                ].map((f, i) => (
                  <div key={i} className="bg-darkBg/60 border border-white/5 p-6 rounded-2xl hover:border-ecoGreen/25 hover:bg-white/5 transition-all duration-300 group flex flex-col items-start text-left">
                    <span className="text-4xl mb-4 group-hover:scale-110 transition duration-300">{f.emoji}</span>
                    <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 3 — Why TerraTwin? */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-black text-white">Why TerraTwin?</h2>
                <p className="text-sm text-gray-400 mt-2">Designed from the ground up for projection-led decarbonization.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: "Predicts Future", desc: "not just tracks past", accent: "from-ecoTeal/20 to-transparent" },
                  { title: "AI Automation", desc: "not manual logging", accent: "from-ecoGreen/20 to-transparent" },
                  { title: "Digital Twin", desc: "not static reports", accent: "from-teal-500/20 to-transparent" },
                  { title: "Eco Rewards", desc: "for sustainable actions", accent: "from-emerald-500/20 to-transparent" },
                ].map((item, idx) => (
                  <div key={idx} className="relative overflow-hidden rounded-2xl border border-white/5 bg-darkBg/50 p-6 flex flex-col justify-between h-40 text-left hover:border-white/10 transition-all duration-300 group">
                    <div className={`absolute inset-0 bg-gradient-to-br ${item.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    <div className="relative z-10 space-y-2">
                      <h4 className="text-xl font-black text-white">{item.title}</h4>
                      <p className="text-xs text-ecoGreen-light font-bold tracking-wide uppercase">{item.desc}</p>
                    </div>
                    <div className="relative z-10 self-end text-white/20 group-hover:text-white/40 transition-colors">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 4 — How It Works */}
          <section className="py-20 bg-white/2 border-t border-white/5">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-black text-white">How It Works</h2>
                <p className="text-sm text-gray-400 mt-2">Five seamless steps to absolute sustainability.</p>
              </div>

              <div className="flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-4 relative">
                {[
                  { step: "1", label: "Scan", icon: <Camera className="w-6 h-6" />, desc: "Upload bills & foods" },
                  { step: "2", label: "Analyze", icon: <Cpu className="w-6 h-6" />, desc: "AI calculates carbon" },
                  { step: "3", label: "Predict", icon: <TrendingUp className="w-6 h-6" />, desc: "Simulate future trends" },
                  { step: "4", label: "Recommend", icon: <MessageSquare className="w-6 h-6" />, desc: "Custom Gemini strategies" },
                  { step: "5", label: "Improve", icon: <Leaf className="w-6 h-6" />, desc: "Earn tokens & heal Earth" },
                ].map((item, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex flex-col items-center text-center max-w-[200px] relative z-10 group">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ecoGreen/10 to-ecoTeal/10 border border-ecoGreen/20 flex items-center justify-center text-ecoGreen-light mb-4 group-hover:border-ecoGreen-light transition-all duration-300 relative shadow-lg shadow-ecoGreen/5">
                        {item.icon}
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-ecoTeal text-darkBg text-[10px] font-black flex items-center justify-center border border-darkBg">
                          {item.step}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white mb-1">{item.label}</h4>
                      <p className="text-[10px] text-gray-400 leading-normal">{item.desc}</p>
                    </div>

                    {idx < 4 && (
                      <div className="hidden lg:flex items-center text-white/20 mx-2">
                        <ArrowRight className="w-5 h-5 animate-pulse" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* Section 5 — Stats */}
          <section className="py-20">
            <div className="max-w-7xl mx-auto px-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                {[
                  { value: "10+", label: "Features", sub: "Fully integrated modules" },
                  { value: "98%", label: "Confidence", sub: "Carbon estimation precision" },
                  { value: "81kg", label: "CO₂ Saved", sub: "Average monthly recovery" },
                  { value: "325", label: "Eco Tokens", sub: "Earned per action milestones" },
                ].map((stat, idx) => (
                  <div key={idx} className="bg-darkBg/60 border border-white/5 rounded-2xl p-6 hover:border-ecoGreen/20 transition duration-300 text-left">
                    <span className="text-4xl md:text-5xl font-black bg-gradient-to-r from-ecoGreen-light to-ecoTeal-light bg-clip-text text-transparent block mb-1 font-mono">
                      {stat.value}
                    </span>
                    <span className="text-sm font-bold text-white block mb-0.5">{stat.label}</span>
                    <span className="text-[10px] text-gray-400 font-medium block">{stat.sub}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Section 6 — CTA */}
          <section className="py-24 relative overflow-hidden bg-gradient-to-b from-transparent to-[#050b0f] border-t border-white/5">
            <div className="absolute inset-0 bg-gradient-to-tr from-ecoGreen/5 via-transparent to-ecoTeal/5 blur-3xl pointer-events-none" />
            <div className="max-w-4xl mx-auto px-6 text-center relative z-10 space-y-8">
              <div className="space-y-3">
                <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                  Start Building Your Digital Carbon Twin
                </h2>
                <p className="text-sm md:text-base text-gray-300 max-w-xl mx-auto">
                  Take control of your emissions in real-time, preview scenarios, and earn real rewards.
                </p>
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => setShowLanding(false)}
                  className="px-12 py-5 bg-gradient-to-r from-ecoGreen to-ecoTeal hover:from-ecoGreen-light hover:to-ecoTeal-light text-darkBg font-black text-base rounded-2xl shadow-xl shadow-ecoGreen/10 hover:shadow-ecoGreen/30 active:scale-95 transition-all duration-300 flex items-center gap-2 group"
                >
                  Launch TerraTwin <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </section>

          {/* Simple Footer */}
          <footer className="py-8 border-t border-white/5 text-center text-xs text-gray-500">
            <p>&copy; {new Date().getFullYear()} TerraTwin AI. Built for next-generation planetary recovery.</p>
          </footer>
        </div>
      );
    }


    return (
      <div className="min-h-screen bg-darkBg flex items-center justify-center px-4 relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-ecoGreen/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-ecoTeal/10 rounded-full blur-3xl" />


        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-3xl glass border border-white/10 relative z-10"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex p-3 rounded-2xl bg-ecoGreen/10 text-ecoGreen-light border border-ecoGreen/20 mb-3 animate-bounce">
              <Leaf className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white font-sans">
              TerraTwin <span className="text-ecoGreen-light">AI</span>
            </h1>
            <p className="text-xs text-gray-400 mt-1 font-medium italic">
              "See your carbon future before it happens"
            </p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authError && (
              <div className="p-3 bg-ecoRed/10 border border-ecoRed/20 rounded-xl text-xs text-ecoRed text-center">
                {authError}
              </div>
            )}

            {isRegistering && (
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  className="w-full bg-darkBg/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-ecoGreen/50 focus:outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                placeholder="name@company.com"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                className="w-full bg-darkBg/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-ecoGreen/50 focus:outline-none transition"
              />
            </div>

            <div>
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                className="w-full bg-darkBg/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-ecoGreen/50 focus:outline-none transition"
              />
            </div>

            {isRegistering && (
              <div>
                <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1.5">
                  Monthly Target Limit (kg CO₂)
                </label>
                <input
                  type="number"
                  required
                  placeholder="600"
                  value={authGoal}
                  onChange={(e) => setAuthGoal(Number(e.target.value))}
                  className="w-full bg-darkBg/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:border-ecoGreen/50 focus:outline-none transition"
                />
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-ecoGreen to-ecoTeal hover:from-ecoGreen-light hover:to-ecoTeal-light text-darkBg font-extrabold text-sm rounded-xl transition active:scale-95 shadow-lg shadow-ecoGreen/10 flex items-center justify-center gap-2 mt-4"
            >
              {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
              {isRegistering ? "Create Account" : "Access Console"}
            </button>
          </form>

          {/* Toggle link */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError("");
              }}
              className="text-xs text-ecoGreen-light hover:text-ecoGreen font-semibold transition"
            >
              {isRegistering
                ? "Already have an account? Sign In"
                : "New to TerraTwin? Create an Account"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-darkBg flex flex-col">
      {/* Header navbar */}
      <header className="border-b border-white/5 bg-darkBg/60 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-ecoGreen/15 border border-ecoGreen/25 rounded-xl text-ecoGreen-light">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-black text-white tracking-tight leading-none">TerraTwin</span>
                <span className="text-xs font-black bg-ecoGreen text-darkBg px-1.5 py-0.5 rounded">AI</span>
              </div>
              <span className="text-[9px] text-gray-500 block leading-none mt-1 font-medium">
                See your carbon future before it happens
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-xs font-bold text-white leading-none">{user?.name}</span>
              <span className="text-[9px] text-gray-500 font-mono mt-1 break-all select-all">
                Wallet: {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : "0x00...00"}
              </span>
            </div>

            <button
              onClick={() => setTheme(prev => prev === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition active:scale-95 flex items-center justify-center"
              title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {theme === "dark" ? <Sun className="w-4 h-4 text-ecoGold" /> : <Moon className="w-4 h-4 text-ecoTeal" />}
            </button>

            <button
              onClick={logout}
              className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/10 transition active:scale-95 flex items-center justify-center gap-1.5"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-semibold hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col lg:flex-row gap-6">
        {/* Navigation Sidebar */}
        <nav className="w-full lg:w-60 bg-darkBg/40 lg:sticky lg:top-22 self-start flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-visible pb-3 lg:pb-0 border-b lg:border-b-0 border-white/5 lg:pr-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "twin", label: "TerraTwin AI", icon: Eye },
            { id: "commute", label: "Trip Tracker", icon: Navigation },
            { id: "camera", label: "AI Scanner", icon: Camera },
            { id: "bot", label: "EcoBot Chat", icon: MessageSquare },
            { id: "story", label: "Carbon Story", icon: Sparkles },
            { id: "privacy", label: "Privacy Audit", icon: Shield },
            { id: "leaderboard", label: "Leaderboard", icon: Trophy }
          ].map((tab) => {
            const IconComp = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-3 py-2.5 px-4 rounded-xl border text-xs font-bold transition whitespace-nowrap lg:w-full ${
                  active
                    ? "bg-ecoGreen/10 border-ecoGreen text-ecoGreen-light shadow-md"
                    : "bg-transparent border-transparent text-gray-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <IconComp className="w-4.5 h-4.5" />
                {tab.label}
              </button>
            );
          })}
        </nav>

        {/* Tab content viewer */}
        <section className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === "dashboard" && (
                <Dashboard
                  token={token!}
                  userGoal={user?.monthlyGoal || 600}
                  userName={user?.name || "Eco Citizen"}
                  refreshTrigger={refreshTrigger}
                  onRefresh={triggerRefresh}
                />
              )}
              {activeTab === "twin" && (
                <TerraTwinPanel
                  token={token!}
                  refreshTrigger={refreshTrigger}
                />
              )}
              {activeTab === "commute" && (
                <TripTracker
                  token={token!}
                  onTripLogged={triggerRefresh}
                />
              )}
              {activeTab === "camera" && (
                <AICamera
                  token={token!}
                  onScanCompleted={triggerRefresh}
                />
              )}
              {activeTab === "bot" && (
                <EcoAgent token={token!} />
              )}
              {activeTab === "story" && (
                <CarbonStory token={token!} />
              )}
              {activeTab === "privacy" && (
                <PrivacyDashboard token={token!} />
              )}
              {activeTab === "leaderboard" && (
                <LeaderboardConsole token={token!} />
              )}
            </motion.div>
          </AnimatePresence>
        </section>

        {/* Global Right Panel - Hidden on Privacy page */}
        {activeTab !== "privacy" && (
          <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-4 bg-darkBg/30 border border-white/5 rounded-2xl p-4 lg:sticky lg:top-22 self-start">
            <div className="flex items-center gap-2 pb-2 border-b border-white/5">
              <Leaf className="w-4 h-4 text-ecoGreen-light" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">TerraTwin Status</h4>
            </div>

            {/* Rotating SVG Earth */}
            <div className="py-2 flex justify-center">
              <DigitalEarth health={earthHealth} size={130} interactive />
            </div>

            {/* Progression System Card */}
            {(() => {
              const prog = getProgressionInfo(earthHealth);
              return (
                <div className="bg-darkBg/60 border border-white/5 rounded-xl p-3 flex flex-col gap-2.5 text-left">
                  <div className="flex justify-between items-baseline pb-1.5 border-b border-white/5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">🌍 Earth Health</span>
                    <span className="text-sm font-black text-white">{earthHealth}%</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Current Level</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400 font-extrabold flex items-center gap-1">
                      {prog.level}
                    </span>
                  </div>

                  {prog.next !== "Max Level Reached" && (
                    <>
                      <div className="flex justify-between items-center mt-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase">Next Level</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-ecoGreen/10 border border-ecoGreen/20 text-ecoGreen-light font-extrabold flex items-center gap-1">
                          {prog.next}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center text-[9px] text-gray-400 font-mono mt-1">
                        <span className="font-bold">Progress</span>
                        <span className="font-bold text-white">{earthHealth}% → {prog.max}%</span>
                      </div>

                      {/* Small Progress Bar */}
                      <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mt-0.5 border border-white/5 relative">
                        <motion.div
                          className="bg-gradient-to-r from-ecoTeal via-ecoGreen to-emerald-400 h-full rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, Math.max(0, prog.progress))}%` }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="flex justify-between items-baseline mt-0.5 border-t border-white/5 pt-1.5">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">Rank</span>
                    <span className="text-[10px] font-black text-ecoTeal-light">{userRank}</span>
                  </div>
                </div>
              );
            })()}

            {/* Global Health Timeline Stepper */}
            <div className="bg-darkBg/60 border border-white/5 rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Global Health Timeline</span>
              
              <div className="relative border-l-2 border-white/10 ml-2.5 pl-4 space-y-4 py-1.5">
                {/* Initial Step */}
                <div className="relative">
                  <span className="absolute -left-7 top-0.5 w-4 h-4 rounded-full bg-gray-700 border border-darkBg flex items-center justify-center text-[9px] shadow-sm">🌍</span>
                  <div className="flex justify-between items-center text-[10px] pl-1">
                    <span className="font-bold text-gray-300">Today</span>
                    <span className="font-mono text-white font-black">68%</span>
                  </div>
                </div>

                {/* Iterate through actions */}
                {(() => {
                  let runningHealth = 68;
                  return todayActions.map((act, idx) => {
                    runningHealth += act.value;
                    runningHealth = Math.min(100, Math.max(0, runningHealth));
                    return (
                      <div key={act.id || idx} className="relative">
                        <span className={`absolute -left-7 top-0.5 w-4 h-4 rounded-full border border-darkBg flex items-center justify-center text-[9px] shadow-sm ${
                          act.value > 0 ? "bg-ecoGreen" : "bg-ecoRed"
                        }`}>
                          {act.icon}
                        </span>
                        <div className="flex justify-between items-start text-[10px] pl-1">
                          <div className="flex flex-col text-left">
                            <span className="font-bold text-white leading-none">{act.text}</span>
                            {act.detail && <span className="text-[8px] text-gray-400 font-medium mt-0.5">{act.detail}</span>}
                          </div>
                          <span className="font-mono text-white font-black leading-none">{runningHealth}%</span>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Total Recovery Badge */}
              {(() => {
                const totalDelta = earthHealth - 68;
                if (totalDelta > 0) {
                  return (
                    <div className="mt-1 border-t border-white/5 pt-2 flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 font-semibold uppercase">Cumulative Impact</span>
                      <span className="px-2.5 py-0.5 rounded bg-ecoGreen/10 border border-ecoGreen/30 text-ecoGreen-light text-[10px] font-black font-mono">
                        +{totalDelta}% Recovery
                      </span>
                    </div>
                  );
                } else if (totalDelta < 0) {
                  return (
                    <div className="mt-1 border-t border-white/5 pt-2 flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 font-semibold uppercase">Cumulative Impact</span>
                      <span className="px-2.5 py-0.5 rounded bg-ecoRed/10 border border-ecoRed/30 text-ecoRed text-[10px] font-black font-mono">
                        {totalDelta}% Impact Haze
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <div className="mt-1 border-t border-white/5 pt-2 flex items-center justify-between">
                      <span className="text-[9px] text-gray-400 font-semibold">Timeline Stable</span>
                      <span className="px-2.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] font-black font-mono">
                        0% Net Change
                      </span>
                    </div>
                  );
                }
              })()}
            </div>

            {/* Mini metrics info */}
            <div className="grid grid-cols-3 gap-1 bg-darkBg/40 border border-white/5 rounded-xl p-2 text-center text-[9px]">
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium leading-none">Current</span>
                <span className="text-white font-extrabold mt-1">{totalCarbon}kg</span>
              </div>
              <div className="flex flex-col border-x border-white/5">
                <span className="text-gray-500 font-medium leading-none">Predicted</span>
                <span className="text-ecoGold font-extrabold mt-1">{predictedHealth}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 font-medium leading-none">Optimized</span>
                <span className="text-ecoGreen-light font-extrabold mt-1">{optimizedHealth}%</span>
              </div>
            </div>

            {/* Future Risk indicator */}
            <div className="bg-darkBg/60 border border-white/5 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
              <span className="text-gray-400 font-bold uppercase tracking-wider">Future Risk</span>
              <span className="font-extrabold">
                {earthHealth > 75 ? "🟢 Low" : earthHealth >= 50 ? "🟡 Medium" : "🔴 High"}
              </span>
            </div>

            {/* Today's Actions feed */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Today's Actions</span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-0.5 scrollbar-thin">
                {todayActions.map((act) => (
                  <div key={act.id} className="bg-darkBg/40 border border-white/5 p-2 rounded-xl text-[10px] flex justify-between items-start transition hover:border-white/10">
                    <div className="flex gap-2">
                      <span className="text-xs mt-0.5">{act.icon}</span>
                      <div className="flex flex-col">
                        <span className="font-bold text-white leading-tight">{act.text}</span>
                        {act.detail && <span className="text-[8px] text-gray-400 font-medium mt-0.5">{act.detail}</span>}
                      </div>
                    </div>
                    <span className={`font-mono font-bold text-[9px] ${act.value > 0 ? "text-ecoGreen" : "text-ecoRed"}`}>
                      {act.value > 0 ? `+${act.value}%` : `${act.value}%`}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* View Details Button */}
            <button
              onClick={() => setActiveTab("twin")}
              className="w-full mt-1 py-2 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 text-white font-bold text-[10px] rounded-xl transition active:scale-95 flex items-center justify-center gap-1"
            >
              <Eye className="w-3 h-3" /> View Details
            </button>
          </aside>
        )}

      </main>

      {/* PWA Installer overlay */}
      {showInstallBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-gradient-to-r from-ecoGreen to-ecoTeal p-4 rounded-xl shadow-2xl flex items-center justify-between text-darkBg z-50 border border-white/10">
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight">TerraTwin AI PWA App</h4>
            <p className="text-[10px] opacity-90 mt-0.5 font-medium leading-tight">Install on your home screen for offline tracking & faster access</p>
          </div>
          <div className="flex gap-2 flex-shrink-0 ml-3">
            <button onClick={() => setShowInstallBanner(false)} className="text-xs font-bold px-2 py-1 hover:bg-black/5 rounded">Dismiss</button>
            <button onClick={handleInstallPWA} className="text-xs font-black bg-darkBg text-white px-3 py-1 rounded-lg transition active:scale-95 shadow-md">Install</button>
          </div>
        </div>
      )}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <SocketProvider>
        <EarthHealthProvider>
          <AppContent />
        </EarthHealthProvider>
      </SocketProvider>
    </AuthProvider>
  );
};

export default App;
