import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import { CarbonTwinService } from "../services/carbonTwin.service";
import { CarbonStoryService } from "../services/carbonStory.service";

const router = Router();
router.use(authenticateToken as any);

// GET /api/analytics/twin
// Returns Current Carbon State, Future Prediction, and Optimized Future Prediction
router.get("/twin", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const twinState = await CarbonTwinService.getTwinState(userId);
    return res.json(twinState);
  } catch (error: any) {
    console.error("Fetch TerraTwin Error:", error);
    return res.status(500).json({ error: error.message || "Failed to fetch TerraTwin state" });
  }
});

// GET /api/analytics/story
// Returns Gemini-generated Monthly Carbon Story
router.get("/story", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const monthIndex = req.query.monthIndex !== undefined ? Number(req.query.monthIndex) : undefined;
    
    const story = await CarbonStoryService.generateMonthlyStory(userId, monthIndex);
    return res.json(story);
  } catch (error: any) {
    console.error("Generate Carbon Story Error:", error);
    return res.status(500).json({ error: error.message || "Failed to generate monthly carbon story" });
  }
});

export default router;
