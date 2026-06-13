import { GoogleGenerativeAI } from "@google/generative-ai";
import { EMISSION_FACTORS } from "../utils/carbonCalculators";

const API_KEY = process.env.GEMINI_API_KEY || "";
const IS_MOCK = !API_KEY || API_KEY === "YOUR_GEMINI_API_KEY";

let genAI: GoogleGenerativeAI | null = null;
if (!IS_MOCK) {
  genAI = new GoogleGenerativeAI(API_KEY);
}

// System instructions for Gemini structured output
const BILL_PROMPT = `
You are an expert energy auditor OCR tool.
Analyze this utility bill image. Extract and return ONLY a JSON object with this exact structure:
{
  "provider": "Name of Utility Provider",
  "usageQuantity": 123.45, (numerical value of electricity/gas/water used)
  "unit": "kWh" or "therms" or "gallons",
  "cost": 45.67 (total amount in currency, number only)
}
Do not write markdown formatting or backticks outside the JSON. Return only raw JSON.
`;

const FOOD_PROMPT = `
You are a sustainable food scientist AI.
Identify the food items in this meal and estimate their weight. Return ONLY a JSON object with this exact structure:
{
  "foodItems": [
    { "name": "beef", "weightGrams": 200 },
    { "name": "rice", "weightGrams": 150 },
    { "name": "vegetables", "weightGrams": 100 }
  ]
}
Map food items to the nearest matching categories: beef, pork, chicken, fish, rice, vegetables, dairy.
Do not write markdown formatting or backticks outside the JSON. Return only raw JSON.
`;

const RECEIPT_PROMPT = `
You are a grocery scanner.
Analyze this shopping receipt image. Extract all food items, categories, and weights if possible. Return ONLY a JSON object with this exact structure:
{
  "items": [
    { "name": "Chicken Breast", "category": "chicken", "price": 8.99, "weightGrams": 500 },
    { "name": "Whole Milk", "category": "dairy", "price": 3.49, "weightGrams": 1000 },
    { "name": "Broccoli", "category": "vegetables", "price": 1.99, "weightGrams": 300 }
  ]
}
Categories must be one of: beef, pork, chicken, fish, rice, vegetables, dairy, other.
Do not write markdown formatting or backticks outside the JSON. Return only raw JSON.
`;

export interface BillAnalysis {
  provider: string;
  usageQuantity: number;
  unit: string;
  cost: number;
  carbonEmitted: number;
  confidence: number;
}

export interface FoodItemAnalysis {
  name: string;
  weightGrams: number;
  carbonEmitted: number;
}

export interface FoodAnalysis {
  foodItems: FoodItemAnalysis[];
  totalCarbonEmitted: number;
  confidence: number;
}

export interface ReceiptItem {
  name: string;
  category: string;
  price: number;
  weightGrams: number;
  carbonEmitted: number;
}

export interface ReceiptAnalysis {
  items: ReceiptItem[];
  totalCarbonEmitted: number;
  confidence: number;
}

export class GeminiService {
  /**
   * Scans a utility bill photo and calculates carbon
   */
  static async scanBill(imageBuffer: Buffer, mimeType: string): Promise<BillAnalysis> {
    if (IS_MOCK) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const usage = Math.round((250 + Math.random() * 200) * 100) / 100; // 250 - 450 kWh
      const cost = Math.round((usage * 0.18) * 100) / 100;
      const carbon = Math.round((usage * EMISSION_FACTORS.energy.electricity) * 100) / 100;

      return {
        provider: "EcoPower Dynamics Ltd",
        usageQuantity: usage,
        unit: "kWh",
        cost: cost,
        carbonEmitted: carbon,
        confidence: 0.95 // 95% confidence for Bill OCR
      };
    }

    try {
      const model = genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        BILL_PROMPT,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimeType
          }
        }
      ]);
      const jsonText = result.response.text().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);

      let factor = EMISSION_FACTORS.energy.electricity;
      if (parsed.unit === "therms") factor = EMISSION_FACTORS.energy.gas;
      else if (parsed.unit === "gallons") factor = 0.005; // placeholder for water carbon

      const carbon = Math.round((parsed.usageQuantity * factor) * 100) / 100;

      return {
        provider: parsed.provider || "Unknown Provider",
        usageQuantity: Number(parsed.usageQuantity) || 0,
        unit: parsed.unit || "kWh",
        cost: Number(parsed.cost) || 0,
        carbonEmitted: carbon,
        confidence: 0.95
      };
    } catch (error) {
      console.error("Gemini Bill OCR Error:", error);
      throw new Error("Failed to scan bill using Gemini API.");
    }
  }

  /**
   * Identifies food ingredients from image and estimates carbon
   */
  static async analyzeFood(imageBuffer: Buffer, mimeType: string): Promise<FoodAnalysis> {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1800));

      // Simulate a meal (e.g. Steak, Rice, Broccoli)
      const mealType = Math.random() > 0.5 ? "beef" : "chicken";
      const meatWeight = 200; // 200g
      const riceWeight = 150; // 150g
      const vegWeight = 100;  // 100g

      const meatFactor = mealType === "beef" ? EMISSION_FACTORS.food.beef : EMISSION_FACTORS.food.chicken;
      
      const meatCarbon = (meatWeight / 1000) * meatFactor;
      const riceCarbon = (riceWeight / 1000) * EMISSION_FACTORS.food.rice;
      const vegCarbon = (vegWeight / 1000) * EMISSION_FACTORS.food.vegetables;

      const items: FoodItemAnalysis[] = [
        { name: mealType, weightGrams: meatWeight, carbonEmitted: Math.round(meatCarbon * 100) / 100 },
        { name: "rice", weightGrams: riceWeight, carbonEmitted: Math.round(riceCarbon * 100) / 100 },
        { name: "vegetables", weightGrams: vegWeight, carbonEmitted: Math.round(vegCarbon * 100) / 100 }
      ];

      const total = items.reduce((sum, item) => sum + item.carbonEmitted, 0);

      return {
        foodItems: items,
        totalCarbonEmitted: Math.round(total * 100) / 100,
        confidence: 0.82 // 82% confidence for Food AI
      };
    }

    try {
      const model = genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        FOOD_PROMPT,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimeType
          }
        }
      ]);
      const jsonText = result.response.text().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);

      const items: FoodItemAnalysis[] = (parsed.foodItems || []).map((item: any) => {
        const cat = (item.name || "").toLowerCase() as keyof typeof EMISSION_FACTORS.food;
        const factor = EMISSION_FACTORS.food[cat] || EMISSION_FACTORS.food.vegetables;
        const carbon = (Number(item.weightGrams) / 1000) * factor;
        return {
          name: item.name,
          weightGrams: Number(item.weightGrams) || 0,
          carbonEmitted: Math.round(carbon * 100) / 100
        };
      });

      const total = items.reduce((sum, item) => sum + item.carbonEmitted, 0);

      return {
        foodItems: items,
        totalCarbonEmitted: Math.round(total * 100) / 100,
        confidence: 0.82
      };
    } catch (error) {
      console.error("Gemini Food Scanner Error:", error);
      throw new Error("Failed to analyze food using Gemini API.");
    }
  }

  /**
   * Scans a receipt and returns items and carbon
   */
  static async scanReceipt(imageBuffer: Buffer, mimeType: string): Promise<ReceiptAnalysis> {
    if (IS_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const items: ReceiptItem[] = [
        {
          name: "Organic Chicken Breast 500g",
          category: "chicken",
          price: 9.49,
          weightGrams: 500,
          carbonEmitted: Math.round((500 / 1000) * EMISSION_FACTORS.food.chicken * 100) / 100
        },
        {
          name: "Fresh Broccoli Crown",
          category: "vegetables",
          price: 2.19,
          weightGrams: 300,
          carbonEmitted: Math.round((300 / 1000) * EMISSION_FACTORS.food.vegetables * 100) / 100
        },
        {
          name: "Whole Milk 1L",
          category: "dairy",
          price: 3.29,
          weightGrams: 1000,
          carbonEmitted: Math.round((1000 / 1000) * EMISSION_FACTORS.food.dairy * 100) / 100
        }
      ];

      const total = items.reduce((sum, item) => sum + item.carbonEmitted, 0);

      return {
        items: items,
        totalCarbonEmitted: Math.round(total * 100) / 100,
        confidence: 0.94 // 94% confidence for receipts
      };
    }

    try {
      const model = genAI!.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent([
        RECEIPT_PROMPT,
        {
          inlineData: {
            data: imageBuffer.toString("base64"),
            mimeType: mimeType
          }
        }
      ]);
      const jsonText = result.response.text().replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(jsonText);

      const items: ReceiptItem[] = (parsed.items || []).map((item: any) => {
        const cat = (item.category || "").toLowerCase() as keyof typeof EMISSION_FACTORS.food;
        const factor = EMISSION_FACTORS.food[cat] || 0; // if other, factor = 0
        const carbon = ((Number(item.weightGrams) || 0) / 1000) * factor;

        return {
          name: item.name,
          category: item.category,
          price: Number(item.price) || 0,
          weightGrams: Number(item.weightGrams) || 0,
          carbonEmitted: Math.round(carbon * 100) / 100
        };
      });

      const total = items.reduce((sum, item) => sum + item.carbonEmitted, 0);

      return {
        items: items,
        totalCarbonEmitted: Math.round(total * 100) / 100,
        confidence: 0.94
      };
    } catch (error) {
      console.error("Gemini Receipt Scanner Error:", error);
      throw new Error("Failed to scan receipt using Gemini API.");
    }
  }
}
