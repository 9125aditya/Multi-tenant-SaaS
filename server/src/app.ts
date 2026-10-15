import express from "express";
import cors from "cors";
import tenantRoutes from "./routes/tenant.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import helmet from "helmet";
import "./config/env.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./config/swagger.js";
import prisma from "./lib/prisma.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({limit : "100kb"}));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SaaS API is running 🚀"
  });
});

app.get("/api/ready", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      message: "SaaS API is ready",
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      message: "Service unavailable",
      database: "disconnected",
    });
  }
});

app.use("/api/tenants", tenantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;