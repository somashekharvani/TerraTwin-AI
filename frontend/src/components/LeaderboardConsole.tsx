import React, { useEffect, useState } from "react";
import { Trophy, Star, ShieldAlert, Award, Calendar, RefreshCw, ChevronRight, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface LeaderboardUser {
  userId: string;
  name: string;
  walletAddress: string;
  balance: number;
  nftStage: string;
  nftIcon: string;
}

interface LeaderboardProps {
  token: string;
}

export const LeaderboardConsole: React.FC<LeaderboardProps> = ({ token }) => {
  const [leaders, setLeaders] = useState<LeaderboardUser[]>([]);
  const [totalSavedKg, setTotalSavedKg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Challenges list
  const [challenges, setChallenges] = useState([
    { id: 1, title: "Meatless Streak", desc: "Go vegetarian for 3 consecutive days", reward: "150 ECO", progress: "2/3", status: "active" },
    { id: 2, title: "Eco-Transit Hero", desc: "Walk or bike 5 commutes this week", reward: "250 ECO", progress: "3/5", status: "active" },
    { id: 3, title: "Energy Saver Pro", desc: "Keep household power below 2.0 kW for 12 hours", reward: "200 ECO", progress: "Completed", status: "done" }
  ]);

  // Badges system
  const badgeThresholds = [
    { name: "Carbon Scout", desc: "Offset 10kg CO₂", limit: 10, icon: "🏅", color: "from-amber-600 to-amber-700" },
    { name: "Green Guardian", desc: "Offset 30kg CO₂", limit: 30, icon: "🥈", color: "from-slate-400 to-slate-500" },
    { name: "Climate Hero", desc: "Offset 50kg CO₂", limit: 50, icon: "🏆", color: "from-yellow-500 to-yellow-600 shadow-yellow-500/20" },
    { name: "Eco Pioneer", desc: "Offset 100kg CO₂", limit: 100, icon: "💎", color: "from-cyan-400 to-teal-500 shadow-cyan-500/20" }
  ];

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("http://localhost:5000/api/tokens/leaderboard", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setLeaders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserData = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/tokens/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setTotalSavedKg(data.totalSavedKg || 0);
      }
    } catch (err) {
      console.error("Balance fetch error:", err);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
    fetchUserData();
  }, [token]);

  const handleClaimChallenge = (id: number) => {
    setChallenges(prev =>
      prev.map(ch => (ch.id === id ? { ...ch, status: "claimed", progress: "Completed" } : ch))
    );
    alert("Challenge reward claimed! ECO tokens will be credited to your wallet. 🎉");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
      {/* Global Leaderboard rank list */}
      <div className="lg:col-span-2 p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-full min-h-[400px]">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-ecoGold" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Global Eco-Leaderboard</h3>
            </div>
            <button
              onClick={fetchLeaderboard}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-8 h-8 border-4 border-ecoGold border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-6 bg-white/5 border border-white/5 rounded-xl text-xs text-ecoRed">
              <ShieldAlert className="w-4 h-4 mr-2" /> {error}
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1.5 scrollbar-thin">
              {leaders.map((user, idx) => {
                const isTopThree = idx < 3;
                const positionIcon = idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : null;
                
                return (
                  <div
                    key={user.userId}
                    className="flex justify-between items-center bg-darkBg/40 border border-white/5 p-3 rounded-xl hover:border-white/10 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-white/5 text-xs font-bold text-white">
                        {positionIcon || idx + 1}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          {user.name}
                          <span className="text-[9px] bg-white/5 px-1.5 py-0.5 rounded text-gray-400 font-mono">
                            {user.nftStage}
                          </span>
                        </div>
                        <span className="text-[8px] text-gray-500 font-mono block mt-0.5">{user.walletAddress}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-black text-ecoGold">{user.balance} <span className="text-[10px] text-gray-400 font-medium">ECO</span></span>
                      <span className="text-[8px] text-gray-500 block mt-0.5">{(user.balance / 4).toFixed(1)}kg Offset</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar: Challenges & Badges */}
      <div className="space-y-6 flex flex-col justify-between h-full">
        {/* Weekly Challenges */}
        <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-4.5 h-4.5 text-ecoTeal" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Weekly Challenges</h3>
          </div>
          
          <div className="space-y-3 flex-grow">
            {challenges.map((ch) => (
              <div key={ch.id} className="bg-darkBg/40 border border-white/5 p-3 rounded-xl flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white">{ch.title}</h4>
                    <p className="text-[10px] text-gray-400 mt-0.5 leading-snug">{ch.desc}</p>
                  </div>
                  <span className="text-[9px] bg-ecoTeal/10 border border-ecoTeal/20 px-1.5 py-0.5 rounded text-ecoTeal-light font-extrabold flex-shrink-0">
                    {ch.reward}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[10px] border-t border-white/5 pt-2">
                  <span className="text-gray-500">Progress: <span className="text-white font-semibold">{ch.progress}</span></span>
                  {ch.status === "active" ? (
                    <span className="text-[9px] font-bold text-ecoGold uppercase">In Progress</span>
                  ) : ch.status === "done" ? (
                    <button
                      onClick={() => handleClaimChallenge(ch.id)}
                      className="bg-ecoGreen hover:bg-ecoGreen-light text-darkBg text-[9px] font-extrabold px-2.5 py-0.5 rounded transition"
                    >
                      Claim
                    </button>
                  ) : (
                    <span className="text-ecoGreen font-bold flex items-center gap-0.5">
                      <CheckCircle2 className="w-3 h-3" /> Claimed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Badges system */}
        <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-4.5 h-4.5 text-ecoGreen" />
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Achievements & Badges</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {badgeThresholds.map((badge, idx) => {
              const unlocked = totalSavedKg >= badge.limit;
              return (
                <div
                  key={idx}
                  className={`border p-3 rounded-xl flex flex-col items-center text-center transition justify-between ${
                    unlocked
                      ? `bg-gradient-to-br ${badge.color} border-white/10 text-white shadow-lg`
                      : "bg-darkBg/20 border-white/5 text-gray-500 opacity-60"
                  }`}
                >
                  <div className="flex flex-col items-center">
                    <span className="text-2xl mb-1.5">{badge.icon}</span>
                    <span className="text-[10px] font-bold tracking-tight block leading-tight">{badge.name}</span>
                    <span className={`text-[8px] mt-0.5 ${unlocked ? "text-white/80" : "text-gray-500"}`}>{badge.desc}</span>
                  </div>
                  
                  {!unlocked && (
                    <div className="w-full mt-2.5 pt-1.5 border-t border-white/5 space-y-1">
                      <div className="flex justify-between text-[7px] text-gray-400 font-bold uppercase">
                        <span>Progress</span>
                        <span>{totalSavedKg.toFixed(0)}/{badge.limit}kg</span>
                      </div>
                      <div className="w-full bg-white/5 rounded-full h-0.5 overflow-hidden">
                        <div 
                          className="bg-ecoTeal h-full" 
                          style={{ width: `${Math.min((totalSavedKg / badge.limit) * 100, 100)}%` }} 
                        />
                      </div>
                    </div>
                  )}

                  {unlocked && (
                    <span className="text-[8px] bg-white/20 px-1.5 py-0.5 rounded-full mt-2 font-bold uppercase">
                      Unlocked
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
