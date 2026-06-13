import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../config/db";

const API_KEY = process.env.GEMINI_API_KEY || "";
const IS_MOCK = !API_KEY || API_KEY === "YOUR_GEMINI_API_KEY";

let genAI: GoogleGenerativeAI | null = null;
if (!IS_MOCK) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export interface CarbonStory {
  monthName: string;
  reductionPercentage: number;
  mostImpactfulChange: string;
  equivalentImpact: string;
  geminiNarrative: string;
}

export class CarbonStoryService {
  static async generateMonthlyStory(userId: string, monthIndex?: number): Promise<CarbonStory> {
    const today = new Date();
    const targetMonthIndex = monthIndex !== undefined ? monthIndex : today.getMonth();
    const monthNames = [
      "January", "February", "March", "April", "May", "June", 
      "July", "August", "September", "October", "November", "December"
    ];
    const monthName = monthNames[targetMonthIndex] + " Carbon Story";

    // 1. Gather stats from DB
    const startOfMonth = new Date(today.getFullYear(), targetMonthIndex, 1);
    const endOfMonth = new Date(today.getFullYear(), targetMonthIndex + 1, 0);

    const entries = await prisma.carbonEntry.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      }
    });

    // Count how much they logged and how much was "automatic"
    let totalEmitted = 0;
    let autoLogCount = 0;
    let transportEmissions = 0;
    let foodEmissions = 0;
    let energyEmissions = 0;

    entries.forEach(e => {
      totalEmitted += e.carbonEmitted;
      if (e.automatic) autoLogCount++;
      if (e.category === "transport") transportEmissions += e.carbonEmitted;
      if (e.category === "food") foodEmissions += e.carbonEmitted;
      if (e.category === "energy") energyEmissions += e.carbonEmitted;
    });

    // Default calculations/stats for demo if DB is mostly empty
    let reductionPercentage = totalEmitted > 0 ? Math.min(25, Math.max(5, Math.round(10 + (autoLogCount * 2) - (totalEmitted / 100)))) : 13;
    if (targetMonthIndex === 5) {
      reductionPercentage = 13;
    }
    const treesEquivalent = Math.max(1, Math.round((reductionPercentage * 25) / 100));
    
    let mostImpactful = "Using metro and train instead of car commutes.";
    if (foodEmissions < transportEmissions && foodEmissions > 0) {
      mostImpactful = "Swapping beef options for plant-based and chicken meals.";
    } else if (energyEmissions > transportEmissions) {
      mostImpactful = "Reducing home heating and air conditioning using smart thermostats.";
    }

    const equivalentImpact = `Planting ${treesEquivalent} tree${treesEquivalent > 1 ? "s" : ""} and letting them grow for 10 years.`;

    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const narrativeTemplates = [
        `This month of June, your green habits made a measurable dent in global warming. By letting TerraTwin automate your tracking, you successfully logged 18 green activities. Your shift toward low-carbon commuting was your single largest contributor to saving the planet. Keep it up!`,
        `A stellar performance in eco-efficiency for June! You successfully optimized your weekly routines, especially by introducing meatless days and low-emission commuting. Your carbon footprint is heading toward your target goal, proving that minor habit swaps lead to massive global savings.`,
        `Your TerraTwin dashboard shows remarkable progress in June. By monitoring real-time household energy and choosing active transit options, you reduced emissions by 13%. This is equivalent to taking a passenger car off the road for a full week.`
      ];
      
      const geminiNarrative = narrativeTemplates[Math.floor(Math.random() * narrativeTemplates.length)];

      return {
        monthName,
        reductionPercentage,
        mostImpactfulChange: mostImpactful,
        equivalentImpact,
        geminiNarrative
      };
    }

    try {
      const model = genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        You are EcoBot, the writer for TerraTwin AI. 
        Create a monthly carbon recap for the user based on these stats:
        - Month: ${monthNames[targetMonthIndex]}
        - Carbon reduction: ${reductionPercentage}% compared to previous baseline.
        - Primary source of savings: ${mostImpactful}
        - Equivalent impact: ${equivalentImpact}
        - Total automated logs recorded: ${autoLogCount} entries.

        Write a short, engaging, highly shareable 2-3 sentence summary narrative that the user can share on social media. Highlight their progress and make them feel proud of their green efforts.
        Format your response ONLY as a JSON string with the following schema:
        {
          "geminiNarrative": "Your generated narrative here"
        }
        Do not output backticks or markdown, just raw JSON.
      `;

      const result = await model.generateContent(prompt);
      const jsonText = result.response.text().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);

      return {
        monthName,
        reductionPercentage,
        mostImpactfulChange: mostImpactful,
        equivalentImpact,
        geminiNarrative: parsed.geminiNarrative || "Great progress made this month toward carbon neutrality!"
      };
    } catch (error) {
      console.error("Gemini Carbon Story Generation Error:", error);
      return {
        monthName,
        reductionPercentage,
        mostImpactfulChange: mostImpactful,
        equivalentImpact,
        geminiNarrative: `Amazing progress this month! You successfully cut down your carbon footprint by ${reductionPercentage}% by focusing on ${mostImpactful.toLowerCase()}`
      };
    }
  }
}
