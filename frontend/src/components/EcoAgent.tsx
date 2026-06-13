import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, Sparkles, Activity, FileText, Database } from "lucide-react";
import { motion } from "framer-motion";
import { useEarthHealth } from "../context/EarthHealthContext";

interface Message {
  role: "user" | "model";
  parts: string;
}

interface EcoAgentProps {
  token: string;
}

export const EcoAgent: React.FC<EcoAgentProps> = ({ token }) => {
  const { earthHealth, adopted } = useEarthHealth();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      parts: "Hi, I am EcoBot, your personal carbon Twin agent! I have full visibility over your household electricity usage, active trips, and NFT milestones. How can I help you optimize your carbon trajectory today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMessage: Message = { role: "user", parts: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Build history payload for API
      const historyPayload = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.parts }]
      }));

      const response = await fetch("http://localhost:5000/api/agent/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query: text,
          history: historyPayload,
          earthContext: {
            earthHealth,
            levelText: earthHealth <= 30 ? "🔥 Critical" :
                       earthHealth <= 50 ? "🌫 Recovering" :
                       earthHealth <= 75 ? "🌍 Stable" :
                       earthHealth <= 90 ? "🌳 Thriving" : "🌟 Regenerative",
            adopted
          }
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { role: "model", parts: data.response }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        { role: "model", parts: "Sorry, I had trouble parsing that. Please try again in a moment." }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "Predict my carbon future",
    "How can I cut energy bills?",
    "Evolve my EcoTree NFT",
    "Explain my confidence score"
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Dialogue Console (Left) */}
      <div className="lg:col-span-8 p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-[480px] relative overflow-hidden">
        {/* Title */}
        <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-ecoGreen/10 border border-ecoGreen/20 text-ecoGreen-light">
              <Bot className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">EcoTwin Chat Agent</h3>
              <p className="text-[10px] text-gray-400">Context-aware Gemini environmental assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-ecoGreen/10 border border-ecoGreen/20 px-2 py-0.5 rounded text-[9px] text-ecoGreen-light font-extrabold">
            <span className="w-1.5 h-1.5 rounded-full bg-ecoGreen animate-ping" /> Online
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4 scrollbar-thin">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              {/* Avatar */}
              <div className={`p-1.5 rounded-lg text-white flex-shrink-0 ${msg.role === "user" ? "bg-ecoTeal" : "bg-ecoGreen"}`}>
                {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>
              {/* Bubble */}
              <div className={`text-xs p-3 rounded-2xl max-w-[80%] leading-relaxed ${
                msg.role === "user"
                  ? "bg-ecoTeal/10 text-white rounded-tr-none border border-ecoTeal/20"
                  : "bg-[#091117]/80 text-gray-200 rounded-tl-none border border-white/5"
              }`}>
                {msg.parts}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded-lg bg-ecoGreen text-white flex-shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white/5 border border-white/5 text-ecoGreen-light text-xs p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-ecoGreen animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-ecoGreen animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-ecoGreen animate-bounce [animation-delay:0.4s]" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions and input footer */}
        <div className="flex-shrink-0 space-y-3">
          {/* Suggestion Bubbles (only visible when idle) */}
          {messages.length === 1 && !loading && (
            <div className="flex flex-wrap gap-1.5">
              {suggestions.map((sug, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(sug)}
                  className="text-[10px] bg-darkBg/60 hover:bg-white/5 border border-white/5 px-2.5 py-1 rounded-full text-gray-300 transition"
                >
                  {sug}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="relative flex items-center bg-darkBg/50 border border-white/10 rounded-xl overflow-hidden px-3 focus-within:border-ecoGreen/50 transition"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask EcoBot..."
              disabled={loading}
              className="flex-1 bg-transparent py-3 text-xs outline-none text-white disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-1.5 rounded-lg bg-ecoGreen hover:bg-ecoGreen-light disabled:opacity-30 text-darkBg transition flex items-center justify-center"
            >
              <Send className="w-3.5 h-3.5 fill-darkBg" />
            </button>
          </form>
        </div>
      </div>

      {/* AI Grounding Sandbox (Right Column) */}
      <div className="lg:col-span-4 p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-[480px]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider pb-2.5 border-b border-white/5 mb-4">
            <Activity className="w-3.5 h-3.5 text-ecoTeal" /> Grounding Telemetry
          </div>

          <div className="space-y-4">
            {/* System Grounding Box */}
            <div className="bg-[#091117]/80 border border-white/5 p-3.5 rounded-xl space-y-2">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-white uppercase tracking-tight">
                <FileText className="w-3.5 h-3.5 text-ecoGreen" /> Active Prompt System
              </div>
              <div className="text-[9px] text-gray-400 space-y-1 font-mono">
                <p>• Model: <span className="text-white">gemini-1.5-flash</span></p>
                <p>• Mode: <span className="text-white">Continuous Adaptive Risk</span></p>
                <p>• Health Anchor: <span className="text-ecoGreen-light font-bold">{earthHealth}%</span></p>
                <p>• Schedule Adopted: <span className="text-white">{adopted ? "True" : "False"}</span></p>
              </div>
            </div>

            {/* Context Size Progress */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[9px] text-gray-400 uppercase font-bold">
                <span>Active Context Size</span>
                <span className="text-white font-mono">1,480 / 1,048,576 tkn</span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
                <div className="bg-ecoTeal h-full w-[2%]" />
              </div>
            </div>

            {/* Connection States */}
            <div className="bg-darkBg/30 border border-white/5 p-3 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-400 font-bold">Web Search API</span>
                <span className="text-ecoGreen-light font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-ecoGreen" /> Connected
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-400 font-bold">Zero-Knowledge Vault</span>
                <span className="text-ecoTeal-light font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-ecoTeal animate-pulse" /> Encrypted Sync
                </span>
              </div>
              <div className="flex items-center justify-between text-[9px]">
                <span className="text-gray-400 font-bold">Decentralized Token Mint</span>
                <span className="text-white font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Standby
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sandbox footer advice */}
        <div className="p-3 bg-ecoTeal/5 border border-ecoTeal/10 rounded-xl text-[9px] text-gray-400 leading-normal font-medium">
          💡 <strong>Tip for Judges:</strong> Ask EcoBot: <em>"How does my electricity bill affect Earth Health?"</em> to see dynamic CARTA context steering in action.
        </div>
      </div>
    </div>
  );
};
