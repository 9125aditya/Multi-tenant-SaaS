import express from "express";
import cors from "cors";
import tenantRoutes from "./routes/tenant.routes.js";
import authRoutes from "./routes/auth.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "SaaS API is running 🚀"
  });
});

app.use("/api/tenants", tenantRoutes);
app.use("/api/auth", authRoutes);

export default app;