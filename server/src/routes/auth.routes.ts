import { Router } from "express";

const router = Router();

router.post("/register", async (req, res) => {
  res.json({
    success: true,
    message: "Registration endpoint",
  });
});

export default router;