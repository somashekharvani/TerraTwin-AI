import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import { AgentService } from "../services/agent.service";

const router = Router();
router.use(authenticateToken as any);

// POST /api/agent/chat
router.post("/chat", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query, history, earthContext } = req.body;
    const userId = req.user!.id;

    if (!query) {
      return res.status(400).json({ error: "query is required" });
    }

    const chatHistory = Array.isArray(history) ? history : [];
    const responseText = await AgentService.chat(userId, query, chatHistory, earthContext);

    return res.json({ response: responseText });
  } catch (error: any) {
    console.error("Agent Chat Route Error:", error);
    return res.status(500).json({ error: error.message || "Failed to chat with EcoBot" });
  }
});

export default router;
