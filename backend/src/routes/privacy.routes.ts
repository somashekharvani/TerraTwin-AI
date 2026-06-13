import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";

const router = Router();
router.use(authenticateToken as any);

// GET /api/privacy/stats
router.get("/stats", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Count photos processed (OCR logs)
    const photosProcessed = await prisma.carbonEntry.count({
      where: {
        userId,
        source: {
          in: ["bill_ocr", "food_camera", "receipt_scanner"]
        }
      }
    });

    // Count total carbon entries stored
    const carbonMetricsStored = await prisma.carbonEntry.count({
      where: { userId }
    });

    // Mock permissions safeguards (verifying restricted accesses)
    const safeguardedPermissions = {
      sms: false,
      email: false,
      banking: false,
      contacts: false
    };

    return res.json({
      photosProcessed,
      carbonMetricsStored,
      safeguardedPermissions
    });
  } catch (error: any) {
    console.error("Fetch Privacy Stats Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch privacy stats" });
  }
});

export default router;
