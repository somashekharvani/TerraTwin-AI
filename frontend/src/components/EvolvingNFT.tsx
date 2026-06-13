import React from "react";
import { motion } from "framer-motion";

interface EvolvingNFTProps {
  totalSavedKg: number;
}

export const EvolvingNFT: React.FC<EvolvingNFTProps> = ({ totalSavedKg }) => {
  // Determine Stage based on exact values
  // 0-50kg: Seed, 50-100kg: Sprout, 100-250kg: Tree, 250-500kg: Forest, 500-1000kg: Wildlife, 1000kg+: Ecosystem
  const getStageInfo = (saved: number) => {
    if (saved < 50) {
      return {
        level: 0,
        name: "Seed",
        description: "Your carbon journey is starting. Nurture your seed by logging green activities.",
        progress: (saved / 50) * 100,
        nextTier: "Sprout (50 kg)",
        color: "from-amber-700 to-amber-500",
        shadow: "shadow-amber-500/20"
      };
    } else if (saved < 100) {
      return {
        level: 1,
        name: "Sprout",
        description: "Your habits are taking root! A sprout has broken through the soil.",
        progress: ((saved - 50) / 50) * 100,
        nextTier: "Young Tree (100 kg)",
        color: "from-emerald-600 to-green-400",
        shadow: "shadow-green-400/20"
      };
    } else if (saved < 250) {
      return {
        level: 2,
        name: "Eco-Tree",
        description: "A strong, flourishing tree. Your habits are actively absorbing carbon.",
        progress: ((saved - 100) / 150) * 100,
        nextTier: "Thriving Forest (250 kg)",
        color: "from-emerald-700 to-teal-500",
        shadow: "shadow-emerald-500/30"
      };
    } else if (saved < 500) {
      return {
        level: 3,
        name: "Forest",
        description: "Your choices are creating a micro-climate! Multiple trees form a protective forest.",
        progress: ((saved - 250) / 250) * 100,
        nextTier: "Wildlife Haven (500 kg)",
        color: "from-teal-600 to-cyan-400",
        shadow: "shadow-teal-400/30"
      };
    } else if (saved < 1000) {
      return {
        level: 4,
        name: "Wildlife Haven",
        description: "Animals are returning! Your saved carbon sustains rich forest biodiversity.",
        progress: ((saved - 500) / 500) * 100,
        nextTier: "Global Ecosystem (1000 kg)",
        color: "from-blue-600 to-emerald-400",
        shadow: "shadow-blue-500/40"
      };
    } else {
      return {
        level: 5,
        name: "Global Ecosystem",
        description: "Ultimate Harmony! You have offset a colossal footprint. Earth is breathing easier.",
        progress: 100,
        nextTier: "Maximum Tier Reached 🌍",
        color: "from-indigo-600 via-teal-400 to-emerald-300",
        shadow: "shadow-indigo-500/50"
      };
    }
  };

  const stage = getStageInfo(totalSavedKg);

  // Render SVG based on stage level
  const renderSVG = () => {
    switch (stage.level) {
      case 0: // Seed
        return (
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Ground */}
            <path d="M20,80 Q50,75 80,80" stroke="#8B4513" strokeWidth="3" fill="none" />
            <ellipse cx="50" cy="80" rx="30" ry="8" fill="#5c2e0b" />
            {/* Glowing Seed */}
            <motion.ellipse
              cx="50"
              cy="76"
              rx="6"
              ry="4"
              fill="#d97706"
              animate={{
                scale: [1, 1.1, 1],
                fill: ["#d97706", "#f59e0b", "#d97706"]
              }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
            {/* Roots hidden indicator */}
            <motion.path
              d="M50,80 Q48,85 46,90 M50,80 Q52,86 55,91"
              stroke="#b45309"
              strokeWidth="1.5"
              fill="none"
              strokeDasharray="3 3"
              animate={{ opacity: [0.4, 0.8, 0.4] }}
              transition={{ repeat: Infinity, duration: 2.5 }}
            />
          </svg>
        );
      case 1: // Sprout
        return (
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Ground */}
            <ellipse cx="50" cy="80" rx="35" ry="7" fill="#4a2508" />
            {/* Stem */}
            <motion.path
              d="M50,80 Q50,65 48,55"
              stroke="#10b981"
              strokeWidth="4"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1 }}
            />
            {/* Leaf 1 */}
            <motion.path
              d="M48,55 Q38,50 40,42 Q48,46 48,55"
              fill="#34d399"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            />
            {/* Leaf 2 */}
            <motion.path
              d="M48,55 Q58,52 60,45 Q52,48 48,55"
              fill="#059669"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring" }}
            />
          </svg>
        );
      case 2: // Eco-Tree
        return (
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Trunk */}
            <path d="M48,80 L48,50 Q48,40 40,35 M52,80 L52,50 Q52,42 60,37" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
            <path d="M50,80 L50,45" stroke="#78350f" strokeWidth="6" fill="none" />
            {/* Foliage */}
            <motion.circle
              cx="50"
              cy="35"
              r="16"
              fill="#10b981"
              opacity="0.95"
              animate={{ y: [0, -1, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            />
            <motion.circle
              cx="38"
              cy="33"
              r="12"
              fill="#34d399"
              opacity="0.9"
              animate={{ y: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2.7, ease: "easeInOut" }}
            />
            <motion.circle
              cx="60"
              cy="35"
              r="13"
              fill="#047857"
              opacity="0.9"
              animate={{ y: [0, -1.5, 0] }}
              transition={{ repeat: Infinity, duration: 3.3, ease: "easeInOut" }}
            />
          </svg>
        );
      case 3: // Forest
        return (
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Small trees in back */}
            <g opacity="0.6" transform="scale(0.8) translate(10, 20)">
              <path d="M48,80 L48,45 M52,80 L52,45" stroke="#78350f" strokeWidth="4" />
              <circle cx="50" cy="35" r="14" fill="#047857" />
            </g>
            <g opacity="0.6" transform="scale(0.8) translate(50, 15)">
              <path d="M48,80 L48,45 M52,80 L52,45" stroke="#78350f" strokeWidth="4" />
              <circle cx="50" cy="35" r="14" fill="#065f46" />
            </g>
            {/* Primary tree in front */}
            <path d="M47,85 L47,45 M53,85 L53,45" stroke="#451a03" strokeWidth="7" />
            <path d="M50,85 L50,40" stroke="#78350f" strokeWidth="8" />
            <motion.circle
              cx="50"
              cy="35"
              r="18"
              fill="#10b981"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 4 }}
            />
            <circle cx="35" cy="38" r="14" fill="#34d399" />
            <circle cx="65" cy="40" r="14" fill="#059669" />
          </svg>
        );
      case 4: // Wildlife Haven
        return (
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Tree */}
            <path d="M50,85 L50,35" stroke="#451a03" strokeWidth="8" />
            <circle cx="50" cy="30" r="20" fill="#047857" opacity="0.8" />
            <circle cx="34" cy="35" r="16" fill="#10b981" opacity="0.9" />
            <circle cx="66" cy="35" r="16" fill="#059669" opacity="0.9" />
            <circle cx="50" cy="22" r="18" fill="#34d399" opacity="0.95" />
            {/* Deer under tree */}
            <motion.g 
              transform="translate(18, 56) scale(0.65)"
              animate={{ x: [18, 19, 18] }}
              transition={{ repeat: Infinity, duration: 5 }}
            >
              {/* Deer body */}
              <ellipse cx="40" cy="35" rx="12" ry="7" fill="#f59e0b" />
              {/* Legs */}
              <line x1="32" y1="35" x2="32" y2="48" stroke="#f59e0b" strokeWidth="2.5" />
              <line x1="36" y1="35" x2="36" y2="48" stroke="#f59e0b" strokeWidth="2.5" />
              <line x1="44" y1="35" x2="44" y2="48" stroke="#f59e0b" strokeWidth="2.5" />
              <line x1="48" y1="35" x2="48" y2="48" stroke="#f59e0b" strokeWidth="2.5" />
              {/* Neck & Head */}
              <path d="M46,32 Q54,25 52,15" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" fill="none" />
              <circle cx="52" cy="14" r="3" fill="#f59e0b" />
              {/* Antlers */}
              <path d="M52,12 Q55,5 57,8 M52,12 Q49,6 47,8" stroke="#d97706" strokeWidth="1.5" fill="none" />
            </motion.g>
          </svg>
        );
      default: // Global Ecosystem
        return (
          <svg className="w-48 h-48" viewBox="0 0 100 100">
            {/* Spinning Globe Grid lines */}
            <motion.circle
              cx="50"
              cy="50"
              r="30"
              stroke="rgba(20, 184, 166, 0.15)"
              strokeWidth="1.5"
              fill="none"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            />
            {/* Globe Base */}
            <circle cx="50" cy="50" r="28" fill="#1e293b" opacity="0.3" stroke="#2dd4bf" strokeWidth="1" />
            
            {/* Glowing continent silhouettes */}
            <motion.path
              d="M32,45 Q40,35 48,40 T65,45 T70,55 Q55,68 40,60 Z"
              fill="#059669"
              opacity="0.55"
              animate={{
                fill: ["#059669", "#10b981", "#059669"]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
            />

            {/* Encircling leaves */}
            <motion.path
              d="M15,50 A35,35 0 0,1 85,50"
              stroke="#34d399"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="4 4"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
            />
            <motion.path
              d="M15,50 A35,35 0 0,0 85,50"
              stroke="#14b8a6"
              strokeWidth="2.5"
              fill="none"
              strokeDasharray="4 4"
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
            />
            
            {/* Glowing sparkles */}
            <motion.circle cx="30" cy="25" r="1.5" fill="#fff" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.5 }} />
            <motion.circle cx="70" cy="30" r="2" fill="#2dd4bf" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 2, delay: 0.5 }} />
            <motion.circle cx="45" cy="75" r="1.5" fill="#34d399" animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1.8, delay: 1 }} />
          </svg>
        );
    }
  };

  return (
    <div className="flex flex-col items-center p-6 rounded-2xl glass-glow border border-ecoGreen/10 relative overflow-hidden">
      {/* Background aura */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-gradient-to-tr ${stage.color} opacity-[0.06] blur-2xl pointer-events-none`} />

      {/* Level Badge */}
      <div className="absolute top-4 right-4 bg-ecoGreen-dark/40 border border-ecoGreen/30 px-3 py-1 rounded-full text-xs font-semibold text-ecoGreen-light tracking-wide">
        LEVEL {stage.level}
      </div>

      <h3 className="text-xl font-bold tracking-tight text-white mt-2 mb-1">
        Your Evolving NFT
      </h3>
      <p className="text-ecoGreen-light font-extrabold text-lg tracking-wider mb-4 uppercase">
        {stage.name}
      </p>

      {/* Interactive visual */}
      <div className="relative flex items-center justify-center p-2 mb-4 bg-darkBg/30 rounded-full border border-white/5 w-52 h-52">
        {renderSVG()}
      </div>

      <p className="text-sm text-gray-400 text-center max-w-xs px-2 mb-6 min-h-[40px]">
        {stage.description}
      </p>

      {/* Progress towards next NFT tier */}
      <div className="w-full bg-darkBg/60 border border-white/5 rounded-full p-3 glass-light">
        <div className="flex justify-between items-center text-xs text-gray-400 mb-2">
          <span>Carbon Savings Offset</span>
          <span className="font-semibold text-white">{totalSavedKg.toFixed(1)} kg saved</span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden mb-1.5">
          <motion.div
            className="bg-gradient-to-r from-ecoGreen to-ecoTeal h-full"
            initial={{ width: 0 }}
            animate={{ width: `${stage.progress}%` }}
            transition={{ duration: 1 }}
          />
        </div>
        <div className="flex justify-between items-center text-[10px] text-gray-500">
          <span>{stage.name}</span>
          <span className="text-ecoTeal-light">Next: {stage.nextTier}</span>
        </div>
      </div>
    </div>
  );
};
