import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth.middleware";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "terratwin_jwt_super_secret_key_987654321";

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password, name, monthlyGoal } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: "Email, password, and name are required" });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        monthlyGoal: Number(monthlyGoal) || 200,
        // Mock a wallet address for blockchain
        walletAddress: "0x" + Math.random().toString(16).slice(2, 42).padEnd(40, "0")
      }
    });

    // Award initial welcome tokens
    await prisma.tokenTransaction.create({
      data: {
        userId: user.id,
        action: "welcome_bonus",
        amount: 100,
        transactionHash: "0x" + Math.random().toString(16).slice(2, 66)
      }
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        monthlyGoal: user.monthlyGoal,
        walletAddress: user.walletAddress
      }
    });
  } catch (error: any) {
    console.error("Signup Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: "7d"
    });

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        monthlyGoal: user.monthlyGoal,
        walletAddress: user.walletAddress
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// Get profile
router.get("/profile", router.use(authenticateToken) as any, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        monthlyGoal: true,
        walletAddress: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
