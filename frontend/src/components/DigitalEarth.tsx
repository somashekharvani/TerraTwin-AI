import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import earth3DImg from "../assets/earth_3d.png";

interface DigitalEarthProps {
  health: number;
  size?: number;
  interactive?: boolean;
}

export const DigitalEarth: React.FC<DigitalEarthProps> = ({ health, size = 120, interactive = false }) => {
  // Calculate dynamic colors and glows based on health (0-100)
  const getEarthGlow = (h: number) => {
    if (h <= 50) {
      const pct = h / 50;
      return `rgba(239, 68, 68, ${0.15 + pct * 0.1})`; // Critical red glow
    } else if (h <= 75) {
      const pct = (h - 50) / 25;
      return `rgba(20, 184, 166, ${0.25 + pct * 0.15})`; // Teal stable glow
    } else {
      const pct = (h - 75) / 25;
      return `rgba(16, 185, 129, ${0.4 + pct * 0.25})`; // Emerald flourishing green glow
    }
  };

  const getImageFilter = (h: number) => {
    if (h <= 30) {
      // Polluted, dry, brownish-grey
      return "grayscale(80%) brightness(65%) sepia(40%) hue-rotate(15deg) saturate(80%)";
    }
    if (h <= 50) {
      // Hazy recovery
      return "grayscale(40%) brightness(80%) sepia(20%) hue-rotate(5deg) saturate(90%)";
    }
    if (h <= 75) {
      // Normal stable earth colors
      return "grayscale(0%) saturate(110%) brightness(100%) hue-rotate(0deg)";
    }
    if (h <= 90) {
      // Thriving green
      return "saturate(140%) brightness(110%) hue-rotate(-8deg) contrast(105%)";
    }
    // Regenerative emerald glow
    return "saturate(170%) brightness(120%) hue-rotate(-15deg) contrast(110%)";
  };

  const getBadgeDetails = (h: number) => {
    if (h <= 30) return { emoji: "🔥", label: "Critical", style: "bg-red-500/10 border-red-500/30 text-red-400" };
    if (h <= 50) return { emoji: "🌫", label: "Recovering", style: "bg-orange-500/10 border-orange-500/30 text-orange-400" };
    if (h <= 75) return { emoji: "🌍", label: "Stable", style: "bg-teal-500/10 border-teal-500/30 text-teal-400" };
    if (h <= 90) return { emoji: "🌳", label: "Thriving", style: "bg-green-500/10 border-green-500/30 text-green-400" };
    return { emoji: "🌟", label: "Regenerative", style: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.3)]" };
  };

  const glowColor = getEarthGlow(health);
  const filterStyle = getImageFilter(health);
  const badge = getBadgeDetails(health);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Atmosphere Glow Outer Ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: `0 0 35px ${glowColor}`,
          border: `1px solid ${health <= 50 ? "rgba(239, 68, 68, 0.1)" : "rgba(20, 184, 166, 0.15)"}`,
        }}
        animate={{ scale: interactive ? [1, 1.04, 1] : 1 }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
      />

      {/* Level Progression Badge */}
      <div className={`absolute -top-1.5 -right-4.5 z-30 flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border shadow-md backdrop-blur-md transition-all duration-500 ${badge.style}`}>
        <span>{badge.emoji}</span>
        <span>{badge.label}</span>
      </div>

      {/* Floating Leaves (Health >= 76) */}
      <AnimatePresence>
        {health >= 76 && (
          <>
            <motion.div
              key="leaf-1"
              className="absolute z-20 text-[13px] pointer-events-none select-none"
              style={{ top: "8%", left: "-8%" }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -5, 0], rotate: [0, 10, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ y: { repeat: Infinity, duration: 3, ease: "easeInOut" } }}
            >
              🍃
            </motion.div>
            <motion.div
              key="leaf-2"
              className="absolute z-20 text-[11px] pointer-events-none select-none"
              style={{ bottom: "12%", right: "-8%" }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, 5, 0], rotate: [0, -15, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ y: { repeat: Infinity, duration: 4, ease: "easeInOut", delay: 0.5 } }}
            >
              🌱
            </motion.div>
            <motion.div
              key="leaf-3"
              className="absolute z-20 text-[10px] pointer-events-none select-none"
              style={{ top: "62%", left: "-14%" }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1, y: [0, -4, 0], rotate: [0, 5, 0] }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ y: { repeat: Infinity, duration: 3.5, ease: "easeInOut", delay: 1 } }}
            >
              🌿
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Futuristic Orbital Ring Shield (Health >= 80) */}
      <AnimatePresence>
        {health >= 80 && (
          <motion.svg
            key="orbital-ring"
            className="absolute z-20 pointer-events-none overflow-visible"
            style={{ width: size * 1.35, height: size * 1.35 }}
            viewBox="0 0 160 160"
            initial={{ opacity: 0, scale: 0.8, rotate: -22 }}
            animate={{ opacity: 1, scale: 1, rotate: -22 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <ellipse
              cx="80"
              cy="80"
              rx="74"
              ry="18"
              fill="none"
              stroke="rgba(16, 185, 129, 0.7)"
              strokeWidth="2.5"
              strokeDasharray="8 6"
              style={{
                filter: "drop-shadow(0 0 5px rgba(16, 185, 129, 0.8))",
              }}
            />
            {/* Inner neon secondary line */}
            <ellipse
              cx="80"
              cy="80"
              rx="71"
              ry="16"
              fill="none"
              stroke="rgba(20, 250, 180, 0.4)"
              strokeWidth="1"
            />
          </motion.svg>
        )}
      </AnimatePresence>

      {/* 3D Holographic Earth Sphere Image */}
      <motion.img
        src={earth3DImg}
        alt="3D Digital Twin Earth"
        className="rounded-full relative z-10 w-full h-full object-cover border border-white/10"
        style={{
          filter: filterStyle,
          transition: "filter 1.5s ease-in-out",
        }}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
      />
    </div>
  );
};
