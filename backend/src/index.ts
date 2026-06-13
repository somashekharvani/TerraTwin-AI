import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from "./routes/auth.routes";
import visionRoutes from "./routes/vision.routes";
import trackRoutes from "./routes/track.routes";
import agentRoutes from "./routes/agent.routes";
import carbonTwinRoutes from "./routes/carbonTwin.routes";
import privacyRoutes from "./routes/privacy.routes";
import devicesRoutes from "./routes/devices.routes";
import tokensRoutes from "./routes/tokens.routes";
import carbonRoutes from "./routes/carbon.routes";

// Import services
import { IotService } from "./services/iot.service";

const app = express();
const server = http.createServer(app);

// Configure CORS
const allowedOrigins = ["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "*"];
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if in allowed list
      if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true
  })
);

// Support large image payloads (base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Share Socket.io instance with Express router
app.set("io", io);

// Handle socket connections
io.on("connection", (socket) => {
  console.log(`Socket client connected: ${socket.id}`);

  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket client disconnected: ${socket.id}`);
  });
});

// Initialize IoT Energy Meter Simulator
IotService.init(io);

// Welcome endpoint
app.get("/", (req, res) => {
  res.json({ 
    message: "Welcome to the TerraTwin AI Backend API Console", 
    frontendUrl: "http://localhost:5173",
    status: "online"
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", timestamp: new Date() });
});

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/vision", visionRoutes);
app.use("/api/track", trackRoutes);
app.use("/api/agent", agentRoutes);
app.use("/api/analytics", carbonTwinRoutes);
app.use("/api/privacy", privacyRoutes);
app.use("/api/devices", devicesRoutes);
app.use("/api/tokens", tokensRoutes);
app.use("/api/carbon", carbonRoutes);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("Global error handler caught:", err);
  res.status(500).json({ error: err.message || "Internal server error" });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`TerraTwin AI Backend listening on port ${PORT}`);
});
