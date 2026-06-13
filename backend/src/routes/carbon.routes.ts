import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";

const router = Router();
router.use(authenticateToken as any);

// GET /api/carbon/entries
// Retrieves all carbon entries for the user, parsed for the client
router.get("/entries", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const entries = await prisma.carbonEntry.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });

    // Parse metadata from string back to JSON object for the frontend
    const parsedEntries = entries.map(entry => {
      let metadataObj = null;
      if (entry.metadata) {
        try {
          metadataObj = JSON.parse(entry.metadata as string);
        } catch (e) {
          metadataObj = { raw: entry.metadata };
        }
      }
      return {
        ...entry,
        metadata: metadataObj
      };
    });

    return res.json(parsedEntries);
  } catch (error) {
    console.error("Fetch Carbon Entries Error:", error);
    return res.status(500).json({ error: "Failed to fetch carbon entries" });
  }
});

// POST /api/carbon/entries
// Creates a manual carbon entry
router.post("/entries", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { category, type, value, unit, carbonEmitted } = req.body;
    const userId = req.user!.id;

    if (!category || !type || value === undefined || carbonEmitted === undefined) {
      return res.status(400).json({ error: "category, type, value, and carbonEmitted are required" });
    }

    const entry = await prisma.carbonEntry.create({
      data: {
        userId,
        category,
        type,
        value: Number(value),
        unit: unit || "kg",
        carbonEmitted: Number(carbonEmitted),
        source: "manual",
        automatic: false,
        metadata: JSON.stringify({ confidence: 1.0 }) // manual is 100% confident
      }
    });

    // Broadcast WebSocket update
    const io = req.app.get("io");
    if (io) {
      io.emit("carbon:updated", { userId, entry });
    }

    return res.status(201).json({
      ...entry,
      metadata: { confidence: 1.0 }
    });
  } catch (error) {
    console.error("Create Manual Entry Error:", error);
    return res.status(500).json({ error: "Failed to create carbon entry" });
  }
});

export default router;
