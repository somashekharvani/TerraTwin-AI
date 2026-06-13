import React, { createContext, useContext, useState } from "react";

export interface TodayAction {
  id: string;
  text: string;
  detail: string;
  value: number; // e.g. -2, +1, +13
  icon: string;
  time: string;
}

interface EarthHealthContextType {
  earthHealth: number;
  predictedHealth: number;
  optimizedHealth: number;
  totalCarbon: number;
  potentialSavings: number;
  userRank: string;
  adopted: boolean;
  todayActions: TodayAction[];
  healthHistory: number[];
  adoptRecommendations: () => void;
  logTrip: (mode: "car" | "bus" | "walk") => void;
  scanDocument: (type: "bill" | "food" | "receipt", valueDetail: string, carbonKg: number) => void;
}

const EarthHealthContext = createContext<EarthHealthContextType | undefined>(undefined);

export const EarthHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [earthHealth, setEarthHealth] = useState<number>(70);
  const [predictedHealth, setPredictedHealth] = useState<number>(52);
  const [optimizedHealth, setOptimizedHealth] = useState<number>(81);
  const [totalCarbon, setTotalCarbon] = useState<number>(261);
  const [potentialSavings, setPotentialSavings] = useState<number>(65);
  const [userRank] = useState<string>("Top 22% of TerraTwin Users");
  const [adopted, setAdopted] = useState<boolean>(false);
  const [healthHistory, setHealthHistory] = useState<number[]>([70, 72, 65, 67, 70]);

  const [todayActions, setTodayActions] = useState<TodayAction[]>([
    {
      id: "init-bill",
      text: "Bill Scan",
      detail: "67.8 kg CO₂",
      value: -3,
      icon: "⚡",
      time: "10:30 AM",
    },
    {
      id: "init-bus",
      text: "Bus Ride",
      detail: "8 km (Low emission)",
      value: 5,
      icon: "🚌",
      time: "11:45 AM",
    },
  ]);

  const addAction = (text: string, detail: string, value: number, icon: string) => {
    const newAction: TodayAction = {
      id: Math.random().toString(36).substr(2, 9),
      text,
      detail,
      value,
      icon,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setTodayActions((prev) => [...prev, newAction]);
  };

  const adoptRecommendations = () => {
    if (adopted) return;
    setAdopted(true);
    setEarthHealth(81);
    // Add adopted action
    addAction("AI Actions", "Optimized trajectory", 11, "🌳");
    // Update trend sparkline
    setHealthHistory((prev) => {
      const next = [...prev, 81];
      if (next.length > 7) next.shift();
      return next;
    });
  };

  const logTrip = (mode: "car" | "bus" | "walk") => {
    let change = 0;
    let desc = "";
    let detail = "";
    let icon = "";

    if (mode === "car") {
      change = -2;
      desc = "Car Trip";
      detail = "12 km";
      icon = "🚗";
    } else if (mode === "bus") {
      change = 2;
      desc = "Bus Trip";
      detail = "8 km (Low emission)";
      icon = "🚌";
    } else {
      change = 4;
      desc = "Walk Commute";
      detail = "3 km (Zero emission)";
      icon = "🚶";
    }

    setEarthHealth((prev) => {
      const next = Math.max(0, Math.min(100, prev + change));
      // Update trend sparkline
      setHealthHistory((history) => {
        const nextHistory = [...history, next];
        if (nextHistory.length > 7) nextHistory.shift();
        return nextHistory;
      });
      return next;
    });

    addAction(desc, detail, change, icon);
  };

  const scanDocument = (type: "bill" | "food" | "receipt", valueDetail: string, carbonKg: number) => {
    let change = -3;
    let title = "Electricity Bill";
    let icon = "⚡";

    if (type === "food") {
      change = -2;
      title = "Grocery Scan";
      icon = "🛒";
    } else if (type === "receipt") {
      change = -1;
      title = "Receipt Scan";
      icon = "🧾";
    }

    setEarthHealth((prev) => {
      const next = Math.max(0, Math.min(100, prev + change));
      // Update trend sparkline
      setHealthHistory((history) => {
        const nextHistory = [...history, next];
        if (nextHistory.length > 7) nextHistory.shift();
        return nextHistory;
      });
      return next;
    });

    addAction(title, valueDetail, change, icon);
  };

  return (
    <EarthHealthContext.Provider
      value={{
        earthHealth,
        predictedHealth,
        optimizedHealth,
        totalCarbon,
        potentialSavings,
        userRank,
        adopted,
        todayActions,
        healthHistory,
        adoptRecommendations,
        logTrip,
        scanDocument,
      }}
    >
      {children}
    </EarthHealthContext.Provider>
  );
};

export const useEarthHealth = () => {
  const context = useContext(EarthHealthContext);
  if (context === undefined) {
    throw new Error("useEarthHealth must be used within an EarthHealthProvider");
  }
  return context;
};
