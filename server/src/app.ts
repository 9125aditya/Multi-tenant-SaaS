import express from "express";
import cors from "cors";
import tenantRoutes from "./routes/tenant.routes.js";
import userRoutes from "./routes/user.routes.js";
import authRoutes from "./routes/auth.routes.js";
import auditRoutes from "./routes/audit.routes.js";
import { errorHandler } from "./middleware/error.middleware.js";
import helmet from "helmet";
import "./config/env.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);
app.use(express.json({limit : "100kb"}));

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SaaS API is running 🚀"
  });
});

app.use("/api/tenants", tenantRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use(errorHandler);

export default app;