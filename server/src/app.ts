import express from "express";
import cors from "cors";
import tenantRoutes from "./routes/tenant.routes.js";

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

export default app;