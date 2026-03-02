import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import path from 'path';
// Dynamic imports for MongoDB and email service (will be loaded at startup)
let connectDB: any = null;
let initEmailService: any = null;
let startAllJobs: any = null;

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  console.log("[Server] Starting server...");
  console.log(`[Server] NODE_ENV: ${process.env.NODE_ENV}`);
  console.log(`[Server] PORT: ${process.env.PORT}`);
  console.log(`[Server] FRONTEND_URL: ${process.env.FRONTEND_URL}`);
  
  // Initialize MongoDB and email service
  try {
    // Dynamic imports
    const dbModule = await import("../db-mongo.js");
    const emailModule = await import("../email-service.js");
    const jobsModule = await import("../jobs.js");
    
    connectDB = dbModule.connectDB;
    initEmailService = emailModule.initEmailService;
    startAllJobs = jobsModule.startAllJobs;
    console.log("[Server] All services initialized successfully");
  } catch (error) {
    console.error("[Server] Failed to initialize services:", error);
    process.exit(1);
  }

  const app = express();
  const server = createServer(app);
  
  // Configure CORS
  app.use(cors({
    origin: [
      process.env.FRONTEND_URL || 'http://localhost:3000',
      'https://life-vault-frontend.onrender.com',
      'https://life-vault-frontend-p200.onrender.com', // Add actual production URL
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:5173'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  
  // Serve static files from uploads directory
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Import and use API routes
  try {
    const apiRoutes = await import("../api-routes.js");
    app.use("/api", apiRoutes.default);
  } catch (error) {
    console.warn("[Server] API routes not available:", error);
  }
  // development mode uses Vite, production mode serves API only
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  }
  // Remove serveStatic(app) for production since frontend is deployed separately

  // Set FRONTEND_URL early for email links
  const preferredPort = parseInt(process.env.PORT || "3001");
  
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  if (!process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL = process.env.NODE_ENV === "development" 
      ? `http://localhost:3005` 
      : `https://life-vault-frontend-p200.onrender.com`; // Use actual production URL
  }

  console.log(`[Server] FRONTEND_URL set to: ${process.env.FRONTEND_URL}`);

  server.listen(port, '0.0.0.0', () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const serverUrl = isDevelopment 
      ? `http://localhost:${port}` 
      : `https://life-vault-api.onrender.com`;
    
    console.log(`Server running on ${serverUrl}/`);
    
    // Show current IST time
    const istTime = new Date(Date.now() + (5.5 * 60 * 60 * 1000));
    console.log(`[Server] Current IST time: ${istTime.toISOString().replace('Z', '+05:30')}`);
    
    // Start all background jobs after server is ready
    if (startAllJobs) {
      console.log("[Server] Starting background jobs...");
      startAllJobs();
    } else {
      console.warn("[Server] Jobs module not loaded, background jobs not started");
    }
  });

  process.on("SIGINT", async () => {
    console.log("Shutting down server...");
    server.close();
    process.exit(0);
  });
}



startServer().catch((error) => {
  console.error("[Server] Fatal error:", error);
  process.exit(1);
});
