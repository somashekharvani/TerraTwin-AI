import React, { useEffect, useState } from "react";
import { useSocket } from "../context/SocketContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Wallet, Activity, Zap, Flame, Calendar, Award, CheckCircle, RefreshCw, AlertCircle, Sparkles, Leaf } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { EvolvingNFT } from "./EvolvingNFT";
import { ActivityTimeline } from "./ActivityTimeline";
import { useEarthHealth } from "../context/EarthHealthContext";
import { DigitalEarth } from "./DigitalEarth";

interface DashboardProps {
  token: string;
  userGoal: number;
  userName: string;
  refreshTrigger: number;
  onRefresh: () => void;
}

interface CarbonEntry {
  id: string;
  category: string;
  type: string;
  value: number;
  unit: string;
  carbonEmitted: number;
  source: string;
  automatic: boolean;
  metadata: any;
  createdAt: string;
}

interface TokenState {
  walletAddress: string;
  balance: number;
  totalSavedKg: number;
  nftStage: string;
  nftIcon: string;
  transactions: any[];
}

export const Dashboard: React.FC<DashboardProps> = ({ token, userGoal, userName, refreshTrigger, onRefresh }) => {
  const { socket, isConnected } = useSocket();
  const { earthHealth, potentialSavings } = useEarthHealth();
  
  // States
  const [entries, setEntries] = useState<CarbonEntry[]>([]);
  const [tokensData, setTokensData] = useState<TokenState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Live IoT States
  const [livePower, setLivePower] = useState<number>(0);
  const [liveCarbonRate, setLiveCarbonRate] = useState<number>(0);
  const [liveBreakdown, setLiveBreakdown] = useState<any>({ lights: 0, ac: 0, fridge: 0, entertainment: 0 });
  const [powerHistory, setPowerHistory] = useState<{ time: string; kw: number }[]>([]);

  // Web3 state
  const [isWeb3Connecting, setIsWeb3Connecting] = useState(false);
  const [customWallet, setCustomWallet] = useState<string>("");

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Fetch Carbon Entries
      const entriesRes = await fetch("http://localhost:5000/api/carbon/entries", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const entriesData = await entriesRes.json();
      if (!entriesRes.ok) throw new Error(entriesData.error);
      setEntries(entriesData);

      // Fetch Tokens and NFT State
      const tokensRes = await fetch("http://localhost:5000/api/tokens/balance", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const tokensPayload = await tokensRes.json();
      if (!tokensRes.ok) throw new Error(tokensPayload.error);
      setTokensData(tokensPayload);

    } catch (err: any) {
      setError(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, refreshTrigger]);

  // Hook up Socket.io live energy broadcasts
  useEffect(() => {
    if (!socket) return;

    socket.on("energy:update", (data: any) => {
      setLivePower(data.powerUsageKw);
      setLiveCarbonRate(data.carbonRateKgPerHour);
      setLiveBreakdown(data.breakdown);

      // Save to rolling history (max 8 points)
      setPowerHistory(prev => {
        const timeStr = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const next = [...prev, { time: timeStr, kw: data.powerUsageKw }];
        if (next.length > 8) next.shift();
        return next;
      });
    });

    // Hook up real-time token awards
    socket.on("tokens:awarded", (data: any) => {
      // Re-fetch token balances
      fetchData();
    });

    // Hook up general carbon entries updates
    socket.on("carbon:updated", () => {
      // Re-fetch entries
      fetchData();
    });

    return () => {
      socket.off("energy:update");
      socket.off("tokens:awarded");
      socket.off("carbon:updated");
    };
  }, [socket]);

  // Calculate stats
  const totalCarbonThisMonth = entries.reduce((sum, e) => sum + e.carbonEmitted, 0);
  const goalPercentage = Math.min((totalCarbonThisMonth / userGoal) * 100, 100);

  // Group emissions by category for Recharts bar chart
  const getCategoryChartData = () => {
    const categories: Record<string, number> = { transport: 0, energy: 0, food: 0, shopping: 0, waste: 0 };
    entries.forEach(e => {
      const cat = e.category.toLowerCase();
      if (cat in categories) {
        categories[cat] += e.carbonEmitted;
      }
    });

    return Object.keys(categories).map(cat => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      CO2: Math.round(categories[cat] * 10) / 10
    }));
  };

  // Mock MetaMask wallet connection
  const handleConnectWallet = async () => {
    setIsWeb3Connecting(true);
    // Simulate Metamask handshake
    setTimeout(() => {
      const generatedAddress = "0x742d35Cc6634C0532925a3b844Bc454e4438f44e";
      setCustomWallet(generatedAddress);
      setIsWeb3Connecting(false);
      alert("Metamask Wallet Linked! EcoTokens are fully synced to blockchain address: " + generatedAddress);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* User goal profile */}
        <div className="md:col-span-2 p-5 rounded-2xl glass border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-black text-white leading-tight">Welcome, {userName}</h2>
                <p className="text-xs text-gray-400 mt-0.5">Ecology overview and carbon target compliance</p>
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="p-1 text-gray-400 hover:text-white transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
            
            {/* Goal compliance slider */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-400 font-bold uppercase tracking-wider">Monthly Emission Target</span>
                <span className="text-white font-semibold">
                  {totalCarbonThisMonth.toFixed(1)} / {userGoal} kg CO₂
                </span>
              </div>
              <div className="w-full bg-darkBg/80 border border-white/5 h-3.5 rounded-full overflow-hidden p-0.5">
                <motion.div
                  className={`h-full rounded-full ${goalPercentage > 85 ? "bg-ecoRed" : goalPercentage > 50 ? "bg-ecoGold" : "bg-ecoGreen"}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${goalPercentage}%` }}
                  transition={{ duration: 1 }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-gray-500">
                <span>0 kg</span>
                <span>Limit: {userGoal} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Digital Twin Earth Card */}
        <div className="p-4 rounded-2xl glass border border-white/5 flex items-center gap-4 relative overflow-hidden">
          <div className="flex-shrink-0">
            <DigitalEarth health={earthHealth} size={76} />
          </div>
          <div className="flex-grow min-w-0">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <Leaf className="w-3 h-3 text-ecoGreen" /> Digital Twin
            </div>
            <div className="text-base font-black text-white mt-1 leading-tight flex items-center gap-1.5">
              Health: {earthHealth}%
              <span className="text-[9px] font-medium text-ecoGreen-light">
                {earthHealth <= 30 ? "🔥 Critical" :
                 earthHealth <= 50 ? "🌫 Recovering" :
                 earthHealth <= 75 ? "🌍 Stable" :
                 earthHealth <= 90 ? "🌳 Thriving" : "🌟 Regenerative"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 mt-1.5 text-[9px] text-gray-400 leading-snug">
              <div>
                Future Risk:{" "}
                <span className="font-bold text-white">
                  {earthHealth > 75 ? "🟢 Low" : earthHealth >= 50 ? "🟡 Medium" : "🔴 High"}
                </span>
              </div>
              <div>
                Potential Savings: <span className="text-ecoGreen-light font-bold">{potentialSavings} kg CO₂</span>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Asset Balance Card */}
        <div className="p-4 rounded-2xl glass border border-white/5 flex flex-col justify-between">
          <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-ecoTeal" /> Green Assets
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div>
              <div className="text-[8px] text-gray-500 uppercase font-bold">Offset Savings</div>
              <div className="text-base font-black text-white mt-0.5 tracking-tight">
                {tokensData ? tokensData.totalSavedKg.toFixed(1) : "0.0"}{" "}
                <span className="text-[8px] text-gray-400 font-medium">kg</span>
              </div>
            </div>
            <div>
              <div className="text-[8px] text-gray-500 uppercase font-bold">Eco Token</div>
              <div className="text-base font-black text-ecoTeal-light mt-0.5 tracking-tight">
                {tokensData ? tokensData.balance : 0}{" "}
                <span className="text-[8px] text-gray-400 font-medium">ECO</span>
              </div>
            </div>
          </div>
          <div className="mt-2 text-[9px] text-gray-500 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-ecoTeal" /> NFT stage: <span className="text-white font-semibold">{tokensData?.nftStage || "Seed"}</span>
          </div>
        </div>

      </div>

      {/* Second row: Charts and Live IoT */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category emissions Recharts */}
        <div className="lg:col-span-2 p-5 rounded-2xl glass border border-white/5 flex flex-col justify-between min-h-[300px]">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Carbon Category Breakdown</h3>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={getCategoryChartData()} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                  <YAxis stroke="#94a3b8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#151c23", borderColor: "rgba(255,255,255,0.08)", borderRadius: "8px" }}
                    labelStyle={{ color: "#fff", fontSize: "10px", fontWeight: "bold" }}
                    itemStyle={{ fontSize: "10px" }}
                  />
                  <Bar dataKey="CO2" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Evolving NFT view */}
        <div className="h-full">
          <EvolvingNFT totalSavedKg={tokensData?.totalSavedKg || 0} />
        </div>
      </div>

      {/* Third row: Live IoT Energy Meter & Web3 Audit Ledger */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Live IoT meter */}
        <div className="lg:col-span-2 p-6 rounded-2xl glass-glow border border-ecoTeal/10 flex flex-col justify-between min-h-[360px] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-ecoTeal/5 blur-3xl pointer-events-none rounded-full" />
          
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-ecoTeal-light" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Live IoT Smart Meter</h3>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider bg-ecoTeal/10 border border-ecoTeal/20 text-ecoTeal-light px-2 py-0.5 rounded">
                <span className={`w-1.5 h-1.5 rounded-full bg-ecoTeal-light ${isConnected ? "animate-pulse" : "opacity-30"}`} />
                {isConnected ? "IoT Live" : "IoT Offline"}
              </div>
            </div>

            {/* Current draw details */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-darkBg/60 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Current Power Draw</span>
                <div className="text-2xl font-black text-white mt-1 flex items-baseline gap-1.5">
                  {livePower.toFixed(2)}
                  <span className="text-xs text-gray-400 font-medium">kW</span>
                </div>
              </div>
              <div className="bg-darkBg/60 border border-white/5 rounded-xl p-3">
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Real-time Carbon Rate</span>
                <div className="text-2xl font-black text-ecoTeal-light mt-1 flex items-baseline gap-1.5">
                  {liveCarbonRate.toFixed(2)}
                  <span className="text-xs text-gray-400 font-medium">kg/hr</span>
                </div>
              </div>
            </div>

            {/* Appliance breakdown meters */}
            <div className="bg-darkBg/40 border border-white/5 rounded-xl p-3.5 mb-4 space-y-2.5">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block">Appliance Consumption breakdown</span>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="text-[10px] text-gray-400">Lights</div>
                  <div className="font-bold text-white mt-1">{liveBreakdown.lights}W</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="text-[10px] text-gray-400">AC</div>
                  <div className="font-bold text-white mt-1">{liveBreakdown.ac}W</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="text-[10px] text-gray-400">Fridge</div>
                  <div className="font-bold text-white mt-1">{liveBreakdown.fridge}W</div>
                </div>
                <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                  <div className="text-[10px] text-gray-400">Media</div>
                  <div className="font-bold text-white mt-1">{liveBreakdown.entertainment}W</div>
                </div>
              </div>
            </div>

            {/* Real-time power LineChart */}
            <div className="h-28 w-full bg-darkBg/20 border border-white/5 rounded-xl p-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={powerHistory} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <XAxis dataKey="time" stroke="#64748b" fontSize={8} tickLine={false} />
                  <Line type="monotone" dataKey="kw" stroke="#2dd4bf" strokeWidth={1.5} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Blockchain Ledger & Metamask Web3 hook */}
        <div className="p-5 rounded-2xl glass border border-white/5 flex flex-col justify-between h-full min-h-[360px]">
          <div>
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-ecoGreen" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Web3 Token Ledger</h3>
              </div>
            </div>

            {/* Wallet Address Display */}
            <div className="bg-darkBg/60 border border-white/5 rounded-xl p-3.5 mb-4">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Linked Wallet Address
              </span>
              
              {customWallet || (tokensData?.walletAddress && tokensData.walletAddress !== "0x0") ? (
                <div className="font-mono text-xs text-ecoGreen-light break-all leading-normal">
                  {customWallet || tokensData?.walletAddress}
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isWeb3Connecting}
                  className="w-full mt-1.5 bg-ecoGreen/10 border border-ecoGreen/20 hover:bg-ecoGreen/20 text-ecoGreen-light text-xs font-bold py-2 rounded-lg transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  {isWeb3Connecting ? (
                    <span className="w-3.5 h-3.5 border-2 border-ecoGreen-light border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Wallet className="w-3.5 h-3.5" /> Link MetaMask Wallet
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Ledger Transactions list */}
            <div>
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider block mb-2.5">
                On-Chain Audit Trails (Ledger)
              </span>
              
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1.5 scrollbar-thin">
                {tokensData?.transactions && tokensData.transactions.length > 0 ? (
                  tokensData.transactions.map((tx: any) => (
                    <div
                      key={tx.id}
                      className="bg-darkBg/30 border border-white/5 p-2 rounded-lg flex flex-col space-y-0.5"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-white font-medium capitalize">{tx.action.replace(/_/g, " ")}</span>
                        <span className="text-ecoGreen font-bold">+{tx.amount} ECO</span>
                      </div>
                      <div className="font-mono text-[8px] text-gray-500 break-all leading-none">
                        TX: {tx.transactionHash}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-400 text-center py-6">No ledger entries detected.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fourth row: Activity timeline with mobile swiping */}
      <ActivityTimeline entries={entries} />
    </div>
  );
};
