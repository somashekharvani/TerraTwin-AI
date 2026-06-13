import React from "react";
import { Navigation, Zap, Flame, Clock, Calendar, CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface CarbonEntry {
  id: string;
  category: string;
  type: string;
  value: number;
  unit: string;
  carbonEmitted: number;
  source: string;
  automatic: boolean;
  createdAt: string;
}

interface ActivityTimelineProps {
  entries: CarbonEntry[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ entries }) => {
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case "transport":
        return <Navigation className="w-4 h-4 text-ecoGreen-light" />;
      case "energy":
        return <Zap className="w-4 h-4 text-ecoTeal-light" />;
      default:
        return <Flame className="w-4 h-4 text-ecoGold" />;
    }
  };

  const getConfidenceRating = (source: string) => {
    if (source === "manual") return "100%";
    if (source === "iot") return "99%";
    if (source === "food_camera") return "82%";
    if (source === "bill_ocr") return "95%";
    return "90%";
  };

  return (
    <div className="space-y-6">
      {/* Mobile Swipe Section (Horizontal Carousel) */}
      <div className="block md:hidden">
        <div className="flex items-center gap-1.5 mb-3 px-1">
          <Clock className="w-4 h-4 text-ecoGreen" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Swipe Recent Activities</span>
        </div>
        
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none scroll-smooth">
          {entries.length > 0 ? (
            entries.slice(0, 5).map((entry, idx) => (
              <div
                key={entry.id}
                className="min-w-[280px] snap-center bg-darkBg/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between space-y-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-white/5">
                      {getCategoryIcon(entry.category)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white capitalize">{entry.category}</h4>
                      <span className="text-[9px] text-gray-500">{new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className="text-[10px] bg-ecoGreen/10 border border-ecoGreen/20 px-2 py-0.5 rounded text-ecoGreen-light font-bold">
                    {getConfidenceRating(entry.source)} Conf.
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2">
                  <span className="text-xs text-gray-400 capitalize">{entry.type.replace(/_/g, " ")}</span>
                  <div className="text-right">
                    <div className="text-base font-black text-white">{entry.carbonEmitted} kg</div>
                    <span className="text-[9px] text-gray-500">CO₂ Emitted</span>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 text-center py-6 w-full">No recent entries.</div>
          )}
        </div>
      </div>

      {/* Desktop/Tablet Vertical Chronological Timeline */}
      <div className="p-6 rounded-2xl glass border border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <Calendar className="w-5 h-5 text-ecoGreen" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Carbon Activity Timeline</h3>
        </div>

        <div className="relative border-l border-white/5 ml-3 pl-6 space-y-6">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <div key={entry.id} className="relative group">
                {/* Timeline dot */}
                <div className="absolute -left-[33px] top-1.5 p-1 rounded-full bg-[#111823] border border-white/5 text-white group-hover:border-ecoGreen transition">
                  {getCategoryIcon(entry.category)}
                </div>

                {/* Content card */}
                <div className="bg-darkBg/30 border border-white/5 hover:border-white/10 p-4 rounded-xl flex items-center justify-between transition">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white capitalize">{entry.category}</span>
                        <span className="text-[9px] text-gray-500">
                          {new Date(entry.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} at{" "}
                          {new Date(entry.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 capitalize leading-none">
                        Logged {entry.value} {entry.unit} via <span className="text-white font-medium">{entry.source}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-xs font-black text-white">{entry.carbonEmitted} kg CO₂</span>
                      <span className="text-[9px] text-ecoGreen font-semibold block mt-0.5">
                        {getConfidenceRating(entry.source)} confidence rating
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-white transition" />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 py-10 text-center ml-[-24px]">No chronological logs detected.</div>
          )}
        </div>
      </div>
    </div>
  );
};
