import React, { useState, useEffect } from "react";
import { Sparkles, Share2, Download, Award, ChevronRight, Trees, Leaf, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

interface CarbonStoryData {
  monthName: string;
  reductionPercentage: number;
  mostImpactfulChange: string;
  equivalentImpact: string;
  geminiNarrative: string;
}

export const CarbonStory: React.FC<{ token: string }> = ({ token }) => {
  const [story, setStory] = useState<CarbonStoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sharing, setSharing] = useState(false);

  const fetchCarbonStory = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://localhost:5000/api/analytics/story", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStory(data);
    } catch (err: any) {
      setError(err.message || "Failed to fetch carbon story");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCarbonStory();
  }, [token]);

  const handleShare = () => {
    setSharing(true);
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
    setTimeout(() => {
      setSharing(false);
      alert("Recap Link copied! Post it to Twitter or LinkedIn to show off your green accomplishments. 🌍");
    }, 1200);
  };

  return (
    <div className="p-6 rounded-2xl glass-glow border border-ecoTeal/10 flex flex-col h-full relative overflow-hidden">
      {/* Absolute aura */}
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-ecoTeal/10 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-ecoGreen/10 blur-3xl pointer-events-none rounded-full" />

      <div className="flex justify-between items-center mb-5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-ecoTeal-light" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI Monthly Story</h3>
        </div>
        <button
          onClick={fetchCarbonStory}
          disabled={loading}
          className="p-1 text-gray-400 hover:text-white transition disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-ecoTeal border-t-transparent rounded-full animate-spin mb-3" />
          <span className="text-xs text-gray-400">Consulting Gemini for your carbon story...</span>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4">
          <Leaf className="w-6 h-6 text-ecoRed mb-2 animate-bounce" />
          <p className="text-xs text-gray-400">{error}</p>
        </div>
      ) : story ? (
        <div className="flex-grow flex flex-col justify-between">
          {/* Main shareable card */}
          <div className="relative p-5 rounded-xl bg-gradient-to-br from-slate-900 to-[#131d25] border border-white/5 shadow-2xl flex flex-col justify-between space-y-4 mb-4">
            
            {/* Header */}
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-lg font-extrabold text-white tracking-tight leading-none">{story.monthName}</h4>
                <span className="text-[10px] text-ecoTeal-light font-semibold uppercase tracking-wider mt-1 inline-block">TerraTwin AI Infographic</span>
              </div>
              <div className="bg-ecoGreen/10 border border-ecoGreen/30 text-ecoGreen-light rounded-lg px-2.5 py-1 text-center flex items-center gap-1.5">
                <Award className="w-4 h-4" />
                <span className="text-sm font-extrabold">-{story.reductionPercentage}%</span>
              </div>
            </div>

            {/* AI Narrative */}
            <div className="border-l-2 border-ecoTeal/30 pl-3.5 py-1 text-xs italic text-gray-300 leading-relaxed bg-white/5 rounded-r-lg p-2.5">
              "{story.geminiNarrative}"
            </div>

            {/* Breakdown details */}
            <div className="space-y-2 pt-1">
              <div className="flex gap-3 items-start bg-darkBg/30 p-2.5 rounded-lg border border-white/5">
                <Leaf className="w-4 h-4 text-ecoGreen-light mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Hero Action</div>
                  <p className="text-xs text-white mt-0.5">{story.mostImpactfulChange}</p>
                </div>
              </div>
              <div className="flex gap-3 items-start bg-darkBg/30 p-2.5 rounded-lg border border-white/5">
                <Trees className="w-4 h-4 text-ecoTeal-light mt-0.5 flex-shrink-0" />
                <div>
                  <div className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Global Equivalence</div>
                  <p className="text-xs text-white mt-0.5">{story.equivalentImpact}</p>
                </div>
              </div>
            </div>

            <div className="text-[9px] text-gray-500 text-right font-medium italic">
              Powered by Google Gemini OCR & Geolocation Automation
            </div>
          </div>

          {/* LinkedIn Share badge & Referral Promo Card */}
          <div className="bg-[#0e171f] border border-[#2a3e52]/30 p-4 rounded-xl mb-4 space-y-3">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span className="flex items-center gap-1.5"><Share2 className="w-3.5 h-3.5 text-ecoTeal-light" /> LinkedIn Preview Card</span>
              <span className="text-[9px] bg-ecoTeal/10 text-ecoTeal-light border border-ecoTeal/20 px-2 py-0.5 rounded-full font-bold">
                Saved {story.reductionPercentage}% CO₂
              </span>
            </div>

            {/* Generated post textbox */}
            <div 
              className="bg-darkBg/60 border border-white/5 p-3 rounded-lg text-[10px] text-gray-300 font-mono leading-relaxed select-all cursor-pointer"
              title="Click to copy post text"
              onClick={handleShare}
            >
              "I reduced my carbon footprint by {story.reductionPercentage}% this month with TerraTwin AI! Use code ECO-TWIN-82 to claim a 100 ECO signup reward and start automating your carbon tracking. 🌍🌱 #Sustainability #EcoToken"
            </div>

            {/* Referral Info */}
            <div className="flex justify-between items-center text-[10px] bg-white/5 border border-white/5 p-2.5 rounded-lg">
              <div>
                <span className="text-gray-400 font-bold block">Referral Code</span>
                <span className="text-ecoGreen-light font-mono font-bold text-xs mt-0.5 inline-block">ECO-TWIN-82</span>
              </div>
              <span className="text-gray-500 text-right text-[9px] max-w-[50%] leading-snug">
                Earn +50 ECO tokens for every friend who signs up with your code!
              </span>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex gap-2.5">
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex-1 bg-gradient-to-r from-ecoTeal to-ecoGreen hover:from-ecoTeal-light hover:to-ecoGreen-light text-darkBg font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-ecoTeal/10 transition active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              {sharing ? "Sharing..." : "Share Story"}
            </button>
            <button
              onClick={handleShare}
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white p-2.5 rounded-xl flex items-center justify-center transition active:scale-95"
              title="Download Infographic Card"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};
