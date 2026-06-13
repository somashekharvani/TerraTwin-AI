import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";

const router = Router();
router.use(authenticateToken as any);

// GET /api/devices/energy
router.get("/energy", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    // Fetch last 15 energy sensor readings
    const readings = await prisma.smartDevice.findMany({
      where: { userId },
      orderBy: { timestamp: "desc" },
      take: 15
    });

    return res.json(readings.reverse());
  } catch (error) {
    console.error("Fetch energy devices error:", error);
    return res.status(500).json({ error: "Failed to fetch device logs" });
  }
});

// POST /api/devices/sync
router.post("/sync", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { deviceId, deviceName, powerUsage } = req.body;
    const userId = req.user!.id;

    if (!deviceId || !deviceName) {
      return res.status(400).json({ error: "deviceId and deviceName are required" });
    }

    const device = await prisma.smartDevice.create({
      data: {
        userId,
        deviceId,
        deviceName,
        powerUsage: Number(powerUsage) || 0
      }
    });

    return res.status(201).json(device);
  } catch (error) {
    console.error("Sync device error:", error);
    return res.status(500).json({ error: "Failed to sync smart device" });
  }
});

export default router;
