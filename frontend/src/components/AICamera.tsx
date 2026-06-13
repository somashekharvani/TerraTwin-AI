import React, { useState, useRef } from "react";
import { Camera, Upload, AlertCircle, CheckCircle, Flame, FileText, ShoppingBag, Eye, RefreshCw, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEarthHealth } from "../context/EarthHealthContext";

interface AICameraProps {
  token: string;
  onScanCompleted: () => void;
}

export const AICamera: React.FC<AICameraProps> = ({ token, onScanCompleted }) => {
  const [scanType, setScanType] = useState<"bill" | "food" | "receipt">("bill");
  const { scanDocument } = useEarthHealth();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  
  // OCR states
  const [analyzing, setAnalyzing] = useState(false);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generates a mock canvas image based on scanType to test immediately
  const generateMockImage = () => {
    setError("");
    setResult(null);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, 300, 300);

    // Draw background
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 0, 300, 300);

    if (scanType === "bill") {
      // Draw gridlines
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      for (let i = 0; i < 300; i += 20) {
        ctx.beginPath();
        ctx.moveTo(i, 0); ctx.lineTo(i, 300);
        ctx.moveTo(0, i); ctx.lineTo(300, i);
        ctx.stroke();
      }

      // Draw Bill title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("PACIFIC ENERGY CO.", 20, 40);

      // Usage text
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 20px sans-serif";
      ctx.fillText("USAGE: 420 kWh", 20, 110);

      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.fillText("Billing Period: May 1 - May 31", 20, 135);
      ctx.fillText("Account Number: 9812-421-99", 20, 155);
      ctx.fillText("Total Charge: $98.42", 20, 185);

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 2;
      ctx.strokeRect(15, 85, 200, 40);

    } else if (scanType === "food") {
      // Draw a meal plate
      ctx.fillStyle = "#b45309";
      ctx.beginPath();
      ctx.arc(150, 150, 90, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = "#f1f5f9";
      ctx.beginPath();
      ctx.arc(150, 150, 80, 0, 2 * Math.PI);
      ctx.fill();

      // Green salad (Lettuce)
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(120, 120, 30, 0, 2 * Math.PI);
      ctx.fill();

      // Avocado slices
      ctx.fillStyle = "#84cc16";
      ctx.beginPath();
      ctx.arc(140, 160, 25, 0, 2 * Math.PI);
      ctx.fill();

      // Tomato slices
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(170, 130, 18, 0, 2 * Math.PI);
      ctx.fill();

      // Chicken pieces (protein)
      ctx.fillStyle = "#d97706";
      ctx.fillRect(160, 160, 35, 18);
      
      ctx.fillStyle = "#334155";
      ctx.font = "bold 14px sans-serif";
      ctx.fillText("HEALTHY SALAD BOWL", 20, 280);

    } else if (scanType === "receipt") {
      // Draw Receipt paper
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(50, 20, 200, 260);

      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("WHOLE FOODS MARKET", 70, 45);

      ctx.font = "9px monospace";
      ctx.fillText("ORGANIC BANANAS  $2.49", 70, 75);
      ctx.fillText("FREE-RANGE EGGS  $5.99", 70, 95);
      ctx.fillText("ALMOND MILK     $3.89", 70, 115);
      ctx.fillText("LOCAL HONEY     $8.50", 70, 135);
      ctx.fillText("TOTAL CHARGE    $20.87", 70, 175);

      ctx.strokeStyle = "#000";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(68, 150); ctx.lineTo(232, 150);
      ctx.stroke();
    }

    const base64Data = canvas.toDataURL("image/png");
    setImageSrc(base64Data.split(",")[1]); // Store just the base64 content
    setMimeType("image/png");
  };

  // Handles manual file uploading
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    setResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageSrc(reader.result.split(",")[1]);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit scan to backend
  const handleAnalyzeImage = async () => {
    if (!imageSrc || !mimeType) {
      setError("Please capture or upload an image first.");
      return;
    }

    setAnalyzing(true);
    setError("");
    setResult(null);
    setScanLogs([]);

    const steps = [
      "Initializing Gemini Multimodal processor...",
      "Sending image matrices to API endpoints...",
      "Analyzing vision components...",
      "OCR parser identifying usage metrics...",
      "Running carbon emission calculation...",
      "Validating results with Carbon Calculator..."
    ];

    // Simulate ticking of logs
    steps.forEach((step, index) => {
      setTimeout(() => {
        setScanLogs(prev => [...prev, `[SYSTEM]: ${step}`]);
      }, index * 800);
    });

    const route = 
      scanType === "bill" ? "/api/vision/scan-bill" : 
      scanType === "food" ? "/api/vision/analyze-food" : 
      "/api/vision/scan-receipt";

    try {
      // Delay response slightly to show the beautiful scanner animation
      await new Promise(resolve => setTimeout(resolve, 5000));

      const response = await fetch(`http://localhost:5000${route}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ image: imageSrc, mimeType })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process image");
      }

      setResult(data);
      setScanLogs(prev => [...prev, "[SUCCESS]: Calculations synced. EcoTokens awarded!"]);
      
      const carbonVal = data.entry?.carbonEmitted || (scanType === "bill" ? 67.8 : scanType === "food" ? 0.8 : 4.2);
      const detailStr = 
        scanType === "bill" ? "67.8 kg CO₂" : 
        scanType === "food" ? "Healthy Salad Bowl" : 
        "Grocery Scan";
      scanDocument(scanType, detailStr, carbonVal);

      onScanCompleted();
    } catch (err: any) {
      setError(err.message || "Failed to parse image with Gemini");
      setScanLogs(prev => [...prev, `[ERROR]: processing failed.`]);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
      {/* Upload/Scanner Panel (Left Column) */}
      <div className="lg:col-span-6 p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-[480px]">
        <div>
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-ecoTeal" />
              <h3 className="text-sm font-bold text-white leading-tight">AI Vision Automation</h3>
            </div>
            {/* Dropdown scan selection */}
            <select
              value={scanType}
              onChange={(e) => {
                setScanType(e.target.value as any);
                setImageSrc(null);
                setResult(null);
              }}
              className="bg-darkBg/60 border border-white/5 rounded-lg px-2.5 py-1 text-xs text-ecoTeal-light font-bold outline-none cursor-pointer"
            >
              <option value="bill">Utility Bill (OCR)</option>
              <option value="food">Food Camera (Meal)</option>
              <option value="receipt">Grocery Receipt</option>
            </select>
          </div>

          {/* Upload Container */}
          <div className="relative border border-dashed border-white/10 rounded-2xl p-4 bg-darkBg/30 flex flex-col items-center justify-center min-h-[180px] mb-4 group overflow-hidden">
            {imageSrc ? (
              <div className="relative w-full h-36 rounded-xl overflow-hidden flex items-center justify-center bg-darkBg">
                <canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="hidden"
                />
                <img
                  src={`data:${mimeType};base64,${imageSrc}`}
                  alt="Upload preview"
                  className="max-h-full object-contain"
                />

                {/* Glowing scanning laser line */}
                {analyzing && (
                  <motion.div
                    className="absolute left-0 right-0 h-1 bg-ecoTeal shadow-[0_0_10px_#2dd4bf] z-10"
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  />
                )}
              </div>
            ) : (
              <div className="text-center p-3">
                <Upload className="w-7 h-7 text-gray-500 mx-auto mb-2 group-hover:text-white transition" />
                <p className="text-xs text-gray-400 font-medium">Drag photo here or upload file</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </div>
            )}
            
            <canvas ref={canvasRef} width={300} height={300} className="hidden" />
          </div>

          {/* Generate sample button */}
          {!imageSrc && (
            <button
              onClick={generateMockImage}
              className="w-full py-2 border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 font-semibold mb-4 transition flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Generate Sample {scanType === "bill" ? "Electric Bill" : scanType === "food" ? "Salad Meal" : "Grocery Receipt"}
            </button>
          )}
        </div>

        {/* CTA buttons */}
        {imageSrc && !analyzing && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setImageSrc(null);
                setResult(null);
              }}
              className="px-3 border border-white/5 bg-white/5 hover:bg-white/10 rounded-xl text-xs text-gray-300 font-semibold transition"
            >
              Reset
            </button>
            <button
              onClick={handleAnalyzeImage}
              className="flex-grow bg-gradient-to-r from-ecoTeal to-ecoTeal-dark hover:from-ecoTeal-light hover:to-ecoTeal text-darkBg font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-ecoTeal/10 transition active:scale-95 text-xs"
            >
              <Flame className="w-4 h-4 fill-darkBg" />
              Run AI Scan
            </button>
          </div>
        )}
      </div>

      {/* OCR terminal & Result console (Right Column) */}
      <div className="lg:col-span-6 p-6 rounded-2xl glass border border-white/5 flex flex-col justify-between h-[480px]">
        <div className="flex flex-col h-full justify-between">
          <div className="flex items-center justify-between pb-2.5 border-b border-white/5 mb-3">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Vision Analytics Terminal</span>
            <span className="text-[8px] bg-ecoTeal/10 border border-ecoTeal/20 text-ecoTeal-light px-2 py-0.5 rounded font-black uppercase">Gemini-V2</span>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <AnimatePresence mode="wait">
              {analyzing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-[#091117]/80 border border-white/5 p-3.5 rounded-xl font-mono text-[9px] text-ecoTeal-light h-full overflow-y-auto space-y-1.5"
                >
                  {scanLogs.map((log, i) => (
                    <div key={i} className="mb-1">{log}</div>
                  ))}
                  <div className="w-full flex items-center gap-1.5 text-gray-500 pt-1 border-t border-white/5">
                    <RefreshCw className="w-3 h-3 animate-spin text-ecoTeal" /> Parsing multimodal blocks...
                  </div>
                </motion.div>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="bg-ecoGreen/5 border border-ecoGreen/10 p-3.5 rounded-xl flex flex-col space-y-3"
                >
                  <div className="flex justify-between items-center text-xs font-semibold text-white">
                    <span className="flex items-center gap-1 text-[10px]"><CheckCircle className="w-3.5 h-3.5 text-ecoGreen-light" /> Analysis Success</span>
                    <span className="text-[9px] text-ecoGreen-light bg-ecoGreen/10 px-2 py-0.5 rounded font-extrabold">
                      {result.analysis?.confidence ? `${(result.analysis.confidence * 100).toFixed(0)}%` : "95%"} Confidence
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400 pt-1 border-t border-white/5">
                    {scanType === "bill" && (
                      <>
                        <div>Provider: <span className="text-white font-semibold">{result.analysis?.provider || "Utility"}</span></div>
                        <div>Usage: <span className="text-white font-semibold">{result.analysis?.usageQuantity} {result.analysis?.unit}</span></div>
                      </>
                    )}
                    {scanType === "food" && (
                      <>
                        <div className="col-span-2">Ingredients: <span className="text-white font-semibold">{result.analysis?.foodItems?.map((i: any) => `${i.weightGrams}g ${i.name}`).join(", ") || "Salad Components"}</span></div>
                      </>
                    )}
                    {scanType === "receipt" && (
                      <>
                        <div className="col-span-2">Items Count: <span className="text-white font-semibold">{result.analysis?.items?.length || 4} items scanned</span></div>
                      </>
                    )}
                    <div>Emitted: <span className="text-white font-bold">{result.entry?.carbonEmitted} kg CO₂</span></div>
                    <div>Awarded: <span className="text-ecoGreen-light font-bold">+{result.tokensAwarded} ECO Tokens</span></div>
                  </div>

                  {scanType === "bill" && (
                    <div className="bg-[#091117]/80 border border-white/5 p-3 rounded-xl space-y-2 text-left">
                      <div className="text-[8px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-ecoTeal" /> Carbon Impact Equivalence
                      </div>
                      <div className="flex gap-4 items-baseline">
                        <div className="text-base font-black text-white">291 <span className="text-[9px] text-gray-500 font-medium">kWh</span></div>
                        <div className="text-base font-black text-ecoTeal-light">{result.entry?.carbonEmitted || 67.8} <span className="text-[9px] text-gray-500 font-medium">kg CO₂</span></div>
                      </div>
                      <div className="text-[8px] text-gray-500 font-bold uppercase tracking-wider">Equivalent to:</div>
                      <div className="grid grid-cols-2 gap-1.5 text-[9px] text-gray-300">
                        <div className="flex items-center gap-1.5 bg-darkBg/40 border border-white/5 p-1 rounded">
                          <span>🚗</span> <span>Driving 280 km</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-darkBg/40 border border-white/5 p-1 rounded">
                          <span>🌳</span> <span>3 Trees needed</span>
                        </div>
                        <div className="flex items-center gap-1.5 bg-darkBg/40 border border-white/5 p-1 rounded col-span-2">
                          <span>📱</span> <span>Charging 8,000 phones</span>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-ecoRed/10 border border-ecoRed/20 p-3 rounded-xl flex items-center gap-2 text-xs text-ecoRed"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              {!analyzing && !result && !error && (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-30">
                  <FileText className="w-12 h-12 text-gray-500 mb-2" />
                  <p className="text-[10px] text-gray-400">Capture or upload an input source, then run the scan to parse carbon models.</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};
