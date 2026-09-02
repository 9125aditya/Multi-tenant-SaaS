import { Router } from "express";
import prisma from "../lib/prisma.js";

const router = Router();

// Get all tenants
router.get("/", async (req, res) => {
  try {
    const tenants = await prisma.tenant.findMany();

    res.json({
      success: true,
      data: tenants,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch tenants",
    });
  }
});

// Create a tenant
router.post("/", async (req, res) => {
  try {
    const { name, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({
        success: false,
        message: "Name and slug are required",
      });
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        slug,
      },
    });

    res.status(201).json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create tenant",
    });
  }
});

export default router;