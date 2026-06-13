import { Router, Response } from "express";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";
import prisma from "../config/db";
import { getNFTStage } from "../utils/carbonCalculators";

const router = Router();
router.use(authenticateToken as any);

// GET /api/tokens/balance
router.get("/balance", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    // Get wallet address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true }
    });

    // Sum user tokens
    const aggregate = await prisma.tokenTransaction.aggregate({
      where: { userId },
      _sum: { amount: true }
    });
    const balance = aggregate._sum.amount || 0;

    // Fetch transactions
    const transactions = await prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 20
    });

    // Calculate carbon saved. Let's assume 4 ECO tokens awarded = 1 kg CO2 saved.
    // e.g. walked_instead_of_car (50 ECO) = 12.5 kg CO2 saved.
    const totalSavedKg = balance / 4;
    const nftStage = getNFTStage(totalSavedKg);

    return res.json({
      walletAddress: user?.walletAddress || "0x0",
      balance,
      totalSavedKg,
      nftStage: nftStage.name,
      nftIcon: nftStage.icon,
      transactions
    });
  } catch (error) {
    console.error("Fetch Token Balance Error:", error);
    return res.status(500).json({ error: "Failed to fetch token details" });
  }
});

// GET /api/tokens/leaderboard
router.get("/leaderboard", async (req: AuthenticatedRequest, res: Response) => {
  try {
    // We group by userId, sum amount, and then query user details.
    // Since prisma doesn't easily join in groupBys in simple SQLite queries,
    // we can query all token transactions and aggregate them in memory (since it's a prototype/leaderboard).
    const allUsers = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        walletAddress: true
      }
    });

    const leaderData = await Promise.all(
      allUsers.map(async (u) => {
        const aggregate = await prisma.tokenTransaction.aggregate({
          where: { userId: u.id },
          _sum: { amount: true }
        });
        const balance = aggregate._sum.amount || 0;
        
        return {
          userId: u.id,
          name: u.name,
          walletAddress: u.walletAddress ? `${u.walletAddress.slice(0, 6)}...${u.walletAddress.slice(-4)}` : "0x0000...0000",
          balance,
          nftStage: getNFTStage(balance / 4).name,
          nftIcon: getNFTStage(balance / 4).icon
        };
      })
    );

    // Sort by balance descending
    leaderData.sort((a, b) => b.balance - a.balance);

    return res.json(leaderData.slice(0, 10)); // Top 10
  } catch (error) {
    console.error("Fetch Leaderboard Error:", error);
    return res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});

export default router;
