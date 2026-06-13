import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "../config/db";

const API_KEY = process.env.GEMINI_API_KEY || "";
const IS_MOCK = !API_KEY || API_KEY === "YOUR_GEMINI_API_KEY";

let genAI: GoogleGenerativeAI | null = null;
if (!IS_MOCK) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export class AgentService {
  /**
   * Generates a response from EcoBot based on user query and chat history
   */
  static async chat(userId: string, query: string, history: ChatMessage[], earthContext?: any): Promise<string> {
    // 1. Gather user profile details and recent database entries for context
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        carbonEntries: {
          orderBy: { createdAt: "desc" },
          take: 20
        }
      }
    });

    if (!user) {
      throw new Error("User not found");
    }

    const goal = user.monthlyGoal || 200;
    
    // Calculate category aggregates for context
    const categoryTotals: Record<string, number> = {
      transport: 0,
      energy: 0,
      food: 0,
      shopping: 0,
      waste: 0
    };
    
    user.carbonEntries.forEach(entry => {
      const cat = entry.category.toLowerCase();
      if (cat in categoryTotals) {
        categoryTotals[cat] += entry.carbonEmitted;
      }
    });

    const totalEmissions = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
    
    // Find top emission category
    let topCategory = "None";
    let maxVal = -1;
    for (const [cat, val] of Object.entries(categoryTotals)) {
      if (val > maxVal) {
        maxVal = val;
        topCategory = cat;
      }
    }

    const earthHealth = earthContext?.earthHealth || 68;
    const levelText = earthContext?.levelText || "🌍 Stable";
    const adoptedText = earthContext?.adopted ? "Yes" : "No";

    // Build the system instructions with real user data
    const systemPrompt = `
You are EcoBot, a hyper-personalized carbon assistant for the platform TerraTwin AI.

USER PROFILE:
- Name: ${user.name}
- Monthly Goal: ${goal} kg CO₂
- Total emissions logged this month: ${Math.round(totalEmissions * 100) / 100} kg CO₂
- Top emission category: ${topCategory} (${Math.round(maxVal * 100) / 100} kg CO₂)
- Digital Twin Earth Health: ${earthHealth}% (Level: ${levelText})
- Has adopted AI recommendations: ${adoptedText}
- Recent activities: ${
      user.carbonEntries.length > 0 
        ? user.carbonEntries.slice(0, 3).map(e => `${e.type} (${e.carbonEmitted}kg CO₂ via ${e.source})`).join(", ") 
        : "None logged yet"
    }

RULES:
1. Reference specific user database numbers (emissions, goals, categories) and Earth Health (${earthHealth}%, Level: ${levelText}).
2. Calculate exact carbon savings if they make suggested swaps.
3. Suggest alternatives with cost/time tradeoffs (e.g. transit takes 15m longer but saves $5 and 4.2kg CO₂).
4. Celebrate progress, green actions, and improvements to Earth Health.
5. Be concise and friendly. Keep answers to 2-3 short paragraphs.
`;

    if (IS_MOCK) {
      // Wait to simulate network latency
      await new Promise(resolve => setTimeout(resolve, 1200));

      const lowerQuery = query.toLowerCase();

      // Implement a smart mock bot response using the actual database statistics
      if (lowerQuery.includes("hello") || lowerQuery.includes("hi") || lowerQuery.includes("hey")) {
        return `Hello ${user.name}! I'm EcoBot, your personalized carbon twin coach. I've analyzed your database profile. Your goal is set to **${goal} kg CO₂/month**, and you've emitted **${Math.round(totalEmissions * 100) / 100} kg CO₂** so far. 

Your global **Earth Health is at ${earthHealth}% (${levelText})**. Your highest emission category is **${topCategory}**. How can I help you reduce your footprint today?`;
      }

      if (lowerQuery.includes("why") && (lowerQuery.includes("high") || lowerQuery.includes("footprint") || lowerQuery.includes("emission"))) {
        return `Looking at your entries, your **${topCategory}** emissions make up the bulk of your footprint, standing at **${Math.round(maxVal * 100) / 100} kg CO₂**. 
        
Pointing out your twin metrics, your global Earth Health is currently ${levelText} (${earthHealth}%), but we can do more. Swapping just 2 drives per week with a bus or train commute would save you approximately **15.4 kg CO₂ per week** (and save you about $12 in gas!). Would you like to see how this affects your TerraTwin simulation?`;
      }

      if (lowerQuery.includes("token") || lowerQuery.includes("eco") || lowerQuery.includes("earn")) {
        return `You can earn **EcoTokens (ECO)** by completing green activities! 
        
Here is a list of ways to earn right now:
- **Walk instead of drive**: 50 ECO (improves Earth Health by **+4%**)
- **Carpool with coworkers**: 100 ECO (improves Earth Health by **+2%**)
- **Scan an energy bill**: 75 ECO (flags potential savings)
- **Keep a 7-day green streak**: 200 ECO
- **Meet your monthly goal**: 500 ECO

These transactions sync via blockchain contracts. Let me know if you want tips on achieving your streak!`;
      }

      if (lowerQuery.includes("recommend") || lowerQuery.includes("tip") || lowerQuery.includes("suggest") || lowerQuery.includes("win")) {
        return `Based on your recent logs, here are two hyper-personalized recommendations to lower your footprint:
        
1. **Ditch the beef 2x/week**: Switching beef (27 kg CO₂/kg) to chicken (6.9 kg CO₂/kg) saves **8.0 kg CO₂** per meal.
2. **Eco-Commute**: If you take the metro instead of driving for a 15km trip, you save **2.55 kg CO₂** per trip. It takes 10 minutes longer, but you can read and save on parking.

Implementing these recommendations will raise your Digital Twin Earth Health from **${earthHealth}%** up to **${Math.min(100, earthHealth + 8)}%**!`;
      }

      return `I notice you asked about "${query}". Based on your monthly goal of **${goal} kg CO₂** (currently at **${Math.round(totalEmissions * 100) / 100} kg**), I recommend optimizing your **${topCategory}** emissions. 

Your current Earth Health is **${earthHealth}% (${levelText})**. Try using active trip tracking for your next commute, or scan your dinner with our Food Camera. Let me know if you want to run an optimized simulation on your TerraTwin!`;
    }

    try {
      // Real Gemini API conversational call
      const model = genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });
      
      // Format history in the format required by the Gemini chat SDK
      const contents = [
        { role: "user", parts: [{ text: systemPrompt + "\nLet's start our conversation. Respond as EcoBot." }] },
        { role: "model", parts: [{ text: "Understood. I am EcoBot, and I will coach you on reducing your carbon footprint using your personalized statistics." }] }
      ];

      // Add actual chat history
      history.forEach(msg => {
        contents.push({
          role: msg.role,
          parts: [{ text: msg.text }]
        });
      });

      // Add current query
      contents.push({
        role: "user",
        parts: [{ text: query }]
      });

      const chat = model.startChat({
        history: contents.slice(0, -1) // pass history except the current prompt
      });

      const result = await chat.sendMessage(query);
      return result.response.text();
    } catch (error) {
      console.error("Gemini Chat Error:", error);
      return `Sorry, I had trouble connecting to the Gemini core. But looking at your local records, your current total carbon is **${Math.round(totalEmissions * 100) / 100} kg CO₂** against your **${goal} kg** goal. Your primary category to target is **${topCategory}**.`;
    }
  }
}
