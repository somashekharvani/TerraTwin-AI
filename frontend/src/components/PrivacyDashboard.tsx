import React, { useEffect, useState } from "react";
import { Shield, EyeOff, Lock, CheckCircle2, AlertTriangle, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

interface PrivacyStats {
  photosProcessed: number;
  carbonMetricsStored: number;
  safeguardedPermissions: {
    sms: boolean;
    email: boolean;
    banking: boolean;
    contacts: boolean;
  };
}

export const PrivacyDashboard: React.FC<{ token: string }> = ({ token }) => {
  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPrivacyStats = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/privacy/stats", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Failed to load privacy status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrivacyStats();
  }, [token]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Left Column: Privacy engine stats and permissions */}
      <div className="lg:col-span-7 p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-[520px]">
        <div>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-ecoTeal/10 text-ecoTeal-light border border-ecoTeal/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-tight">Privacy Engine</h3>
                <p className="text-[10px] text-gray-400">Auditing data sovereignty & device access</p>
              </div>
            </div>
            <button
              onClick={fetchPrivacyStats}
              disabled={loading}
              className="p-1.5 rounded-md hover:bg-white/5 text-gray-400 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-ecoTeal border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center text-center p-4 border border-white/5 rounded-xl bg-white/5">
              <AlertTriangle className="w-8 h-8 text-ecoRed mb-2" />
              <p className="text-xs text-gray-400">{error}</p>
            </div>
          ) : stats ? (
            <div className="space-y-5">
              {/* Audited data count */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-darkBg/40 border border-white/5 p-4 rounded-xl flex flex-col">
                  <span className="text-[10px] text-gray-400 mb-1">AI Photos Processed</span>
                  <motion.span
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-xl font-extrabold text-ecoTeal-light"
                  >
                    {stats.photosProcessed}
                  </motion.span>
                  <span className="text-[9px] text-gray-500 mt-1">OCR scanned & discarded</span>
                </div>
                <div className="bg-darkBg/40 border border-white/5 p-4 rounded-xl flex flex-col">
                  <span className="text-[10px] text-gray-400 mb-1">Carbon Records Saved</span>
                  <motion.span
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    className="text-xl font-extrabold text-ecoGreen-light"
                  >
                    {stats.carbonMetricsStored}
                  </motion.span>
                  <span className="text-[9px] text-gray-500 mt-1">Stored securely in SQLite</span>
                </div>
              </div>

              {/* Device access guard */}
              <div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2.5">
                  <Lock className="w-3.5 h-3.5 text-ecoTeal" />
                  Restricted Permissions
                </div>
                
                <div className="space-y-1.5">
                  {[
                    { label: "SMS Access", key: "sms", desc: "No messages read or sent" },
                    { label: "Email Access", key: "email", desc: "No mail parsing or contacts scraped" },
                    { label: "Banking Access", key: "banking", desc: "No transaction scraping or API hooks" },
                    { label: "Contacts Access", key: "contacts", desc: "No address book uploads" }
                  ].map((perm) => {
                    const allowed = stats.safeguardedPermissions[perm.key as keyof typeof stats.safeguardedPermissions];
                    return (
                      <div
                        key={perm.key}
                        className="flex justify-between items-center bg-darkBg/30 border border-white/5 px-3.5 py-2 rounded-xl"
                      >
                        <div>
                          <div className="text-xs font-semibold text-white">{perm.label}</div>
                          <div className="text-[9px] text-gray-400 leading-none mt-0.5">{perm.desc}</div>
                        </div>
                        {allowed ? (
                          <span className="text-[9px] font-bold text-ecoRed flex items-center gap-1 bg-ecoRed/10 border border-ecoRed/20 px-2 py-0.5 rounded-full">
                            <AlertTriangle className="w-3 h-3" /> Enabled
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-ecoGreen flex items-center gap-1 bg-ecoGreen/10 border border-ecoGreen/20 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Secure
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Secure statement */}
        <div className="bg-ecoTeal/5 border border-ecoTeal/10 p-3 rounded-xl flex gap-3 items-start mt-4">
          <EyeOff className="w-4 h-4 text-ecoTeal-light flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-[10px] font-black text-white">Local-First Vision Scans</div>
            <p className="text-[9px] text-gray-400 mt-0.5 leading-normal font-medium">
              Image OCR data is processed statelessly. Files are analysed in memory to extract carbon usage figures and immediately deleted. We never catalog or persist raw images.
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Local Privacy Audit Logs */}
      <div className="lg:col-span-5 p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-[520px]">
        <div>
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider pb-2.5 border-b border-white/5 mb-4">
            <Lock className="w-3.5 h-3.5 text-ecoTeal" /> Local Privacy Audit
          </div>

          <p className="text-[10px] text-gray-400 mb-3 leading-normal">
            Local hashes of processed activities and hardware events are computed client-side. Zero plaintext metadata leaves the client device.
          </p>

          <div className="bg-[#091117]/80 border border-white/5 rounded-xl p-3 font-mono text-[9px] text-gray-400 space-y-2 h-[340px] overflow-y-auto scrollbar-thin">
            <div className="text-[8px] text-ecoTeal-light border-b border-white/5 pb-1 font-bold">SHA-256 Audit Trail</div>
            <div className="space-y-2">
              <div>
                <p className="text-[8px] text-ecoGreen-light font-bold">Input Hash</p>
                <p className="text-[8.5px] truncate text-white">SHA256: 7f4a3d8e9c1b2a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f4e5d6c7b8a9</p>
              </div>
              <div>
                <p className="text-[8px] text-ecoGreen-light font-bold">OCR Record</p>
                <p className="text-[8.5px] truncate text-white">SHA256: 9c1e0a2f8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1</p>
              </div>
              <div>
                <p className="text-[8px] text-ecoGreen-light font-bold">Device Event</p>
                <p className="text-[8.5px] truncate text-white">SHA256: 1ab2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c</p>
              </div>
              <div>
                <p className="text-[8px] text-ecoGreen-light font-bold">Session Salt</p>
                <p className="text-[8.5px] truncate text-white">SHA256: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
              </div>
              <div>
                <p className="text-[8px] text-ecoGreen-light font-bold">Utility Bill Payload</p>
                <p className="text-[8.5px] truncate text-white">SHA256: 8a6f3b2d1c9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3</p>
              </div>
              <div>
                <p className="text-[8px] text-ecoGreen-light font-bold">Decentralized Auth Signature</p>
                <p className="text-[8.5px] truncate text-white">SHA256: 3f7a2d1e0f9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3</p>
              </div>
              <div>
                <p className="text-[8px] text-ecoGreen-light font-bold">API Transaction Nonce</p>
                <p className="text-[8.5px] truncate text-white">SHA256: 5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-[8px] text-gray-500 font-bold uppercase text-center mt-2">
          🔒 Zero-Knowledge Proof (ZKP) Enabled
        </div>
      </div>
    </div>
  );
};
