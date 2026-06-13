import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import { EMISSION_FACTORS, TOKEN_AWARDS } from "../utils/carbonCalculators";

const router = Router();
router.use(authenticateToken as any);

// POST /api/track/location
// Logs intermediate location coordinates during active trip
router.post("/location", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.user!.id;

    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: "latitude and longitude are required" });
    }

    const loc = await prisma.location.create({
      data: {
        userId,
        latitude: Number(latitude),
        longitude: Number(longitude)
      }
    });

    return res.status(201).json(loc);
  } catch (error) {
    console.error("Log Location Error:", error);
    return res.status(500).json({ error: "Failed to log location" });
  }
});

// POST /api/track/commute
// Logs a completed active trip commute
router.post("/commute", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { distanceKm, durationSeconds, averageSpeedKmh, mode } = req.body;
    const userId = req.user!.id;

    if (distanceKm === undefined || mode === undefined) {
      return res.status(400).json({ error: "distanceKm and mode are required" });
    }

    const dist = Number(distanceKm);
    const speed = Number(averageSpeedKmh) || 0;
    
    // Classify carbon factor based on mode
    let transportMode = String(mode).toLowerCase();
    
    // Safety check speed classification if mode is auto-detected
    if (transportMode === "auto") {
      if (speed > 40) {
        transportMode = "car";
      } else if (speed >= 20 && speed <= 40) {
        transportMode = "bike"; // 0 kg CO2
      } else if (speed >= 10 && speed < 20) {
        transportMode = "bus";
      } else if (speed > 0 && speed < 10) {
        transportMode = "walking"; // 0 kg CO2
      } else {
        transportMode = "car"; // fallback
      }
    }

    let factor = 0;
    if (transportMode === "car") factor = EMISSION_FACTORS.transport.car;
    else if (transportMode === "bus") factor = EMISSION_FACTORS.transport.bus;
    else if (transportMode === "train") factor = EMISSION_FACTORS.transport.train;
    // walking/bike factors remain 0

    const carbon = Math.round((dist * factor) * 100) / 100;

    const entry = await prisma.carbonEntry.create({
      data: {
        userId,
        category: "transport",
        type: transportMode,
        value: dist,
        unit: "km",
        carbonEmitted: carbon,
        source: "geolocation",
        automatic: true,
        metadata: JSON.stringify({
          durationSeconds: durationSeconds || 0,
          averageSpeedKmh: speed,
          confidence: 0.98 // Transport has 98% confidence
        })
      }
    });

    // Award tokens based on mode
    let tokens = 0;
    let action = "";
    let tx = null;

    if (transportMode === "walking" || transportMode === "bike") {
      tokens = TOKEN_AWARDS.walked_instead_of_car;
      action = "walked_instead_of_car";
    } else if (transportMode === "bus" || transportMode === "train") {
      tokens = TOKEN_AWARDS.carpool; // Public/green transit
      action = "green_transit";
    }

    if (tokens > 0) {
      tx = await prisma.tokenTransaction.create({
        data: {
          userId,
          action,
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
        io.emit("tokens:awarded", { userId, amount: tokens, action, txHash: tx.transactionHash });
      }
    }

    return res.status(201).json({
      entry,
      tokensAwarded: tokens,
      modeDetected: transportMode
    });
  } catch (error) {
    console.error("Log Commute Error:", error);
    return res.status(500).json({ error: "Failed to log commute details" });
  }
});

export default router;
