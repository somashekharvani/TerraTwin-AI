import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import { GeminiService } from "../services/gemini.service";
import prisma from "../config/db";
import { TOKEN_AWARDS } from "../utils/carbonCalculators";

const router = Router();
router.use(authenticateToken as any);

// POST /api/vision/scan-bill
router.post("/scan-bill", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, mimeType } = req.body;
    const userId = req.user!.id;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "image (base64 string) and mimeType are required" });
    }

    const imageBuffer = Buffer.from(image, "base64");
    const result = await GeminiService.scanBill(imageBuffer, mimeType);

    // Save to DB
    const entry = await prisma.carbonEntry.create({
      data: {
        userId,
        category: "energy",
        type: result.unit === "kWh" ? "electricity" : "gas",
        value: result.usageQuantity,
        unit: result.unit,
        carbonEmitted: result.carbonEmitted,
        source: "bill_ocr",
        automatic: true,
        metadata: JSON.stringify({
          provider: result.provider,
          cost: result.cost,
          confidence: result.confidence
        })
      }
    });

    // Award EcoTokens
    const tokens = TOKEN_AWARDS.bill_scanned;
    const tx = await prisma.tokenTransaction.create({
      data: {
        userId,
        action: "bill_scanned",
        amount: tokens,
        transactionHash: "0x" + Math.random().toString(16).slice(2, 66)
      }
    });

    // Broadcast websocket update
    const io = req.app.get("io");
    if (io) {
      io.emit("carbon:updated", { userId, entry });
      io.emit("tokens:awarded", { userId, amount: tokens, action: "bill_scanned", txHash: tx.transactionHash });
    }

    return res.json({
      entry,
      tokensAwarded: tokens,
      analysis: result
    });
  } catch (error: any) {
    console.error("Scan Bill Route Error:", error);
    return res.status(500).json({ error: error.message || "Failed to scan bill" });
  }
});

// POST /api/vision/analyze-food
router.post("/analyze-food", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, mimeType } = req.body;
    const userId = req.user!.id;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "image (base64 string) and mimeType are required" });
    }

    const imageBuffer = Buffer.from(image, "base64");
    const result = await GeminiService.analyzeFood(imageBuffer, mimeType);

    // Save to DB (Log the total meal carbon)
    const primaryIngredient = result.foodItems[0]?.name || "meal";
    const entry = await prisma.carbonEntry.create({
      data: {
        userId,
        category: "food",
        type: primaryIngredient,
        value: result.foodItems.reduce((sum, item) => sum + item.weightGrams, 0),
        unit: "g",
        carbonEmitted: result.totalCarbonEmitted,
        source: "food_camera",
        automatic: true,
        metadata: JSON.stringify({
          ingredients: result.foodItems,
          confidence: result.confidence
        })
      }
    });

    // Award tokens (25 ECO if meal is under 5kg CO2)
    let tokens = 0;
    let tx = null;
    if (result.totalCarbonEmitted < 5.0) {
      tokens = TOKEN_AWARDS.meal_under_5kg_co2;
      tx = await prisma.tokenTransaction.create({
        data: {
          userId,
          action: "meal_under_5kg_co2",
          amount: tokens,
          transactionHash: "0x" + Math.random().toString(16).slice(2, 66)
        }
      });
    }

    // Broadcast websocket update
    const io = req.app.get("io");
    if (io) {
      io.emit("carbon:updated", { userId, entry });
      if (tokens > 0 && tx) {
        io.emit("tokens:awarded", { userId, amount: tokens, action: "meal_under_5kg_co2", txHash: tx.transactionHash });
      }
    }

    return res.json({
      entry,
      tokensAwarded: tokens,
      analysis: result
    });
  } catch (error: any) {
    console.error("Analyze Food Route Error:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze food" });
  }
});

// POST /api/vision/scan-receipt
router.post("/scan-receipt", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { image, mimeType } = req.body;
    const userId = req.user!.id;

    if (!image || !mimeType) {
      return res.status(400).json({ error: "image (base64 string) and mimeType are required" });
    }

    const imageBuffer = Buffer.from(image, "base64");
    const result = await GeminiService.scanReceipt(imageBuffer, mimeType);

    // Save as shopping/food entry
    const entry = await prisma.carbonEntry.create({
      data: {
        userId,
        category: "food",
        type: "grocery_receipt",
        value: result.items.length,
        unit: "items",
        carbonEmitted: result.totalCarbonEmitted,
        source: "receipt_scanner",
        automatic: true,
        metadata: JSON.stringify({
          items: result.items,
          confidence: result.confidence
        })
      }
    });

    // Award 50 tokens
    const tokens = 50;
    const tx = await prisma.tokenTransaction.create({
      data: {
        userId,
        action: "receipt_scanned",
        amount: tokens,
        transactionHash: "0x" + Math.random().toString(16).slice(2, 66)
      }
    });

    // Broadcast websocket update
    const io = req.app.get("io");
    if (io) {
      io.emit("carbon:updated", { userId, entry });
      io.emit("tokens:awarded", { userId, amount: tokens, action: "receipt_scanned", txHash: tx.transactionHash });
    }

    return res.json({
      entry,
      tokensAwarded: tokens,
      analysis: result
    });
  } catch (error: any) {
    console.error("Scan Receipt Route Error:", error);
    return res.status(500).json({ error: error.message || "Failed to scan receipt" });
  }
});

export default router;
