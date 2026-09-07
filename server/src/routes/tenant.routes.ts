import { Router } from "express";
import prisma from "../lib/prisma.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// Get all tenants
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: req.user!.tenantId,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    return res.json({
      success: true,
      data: tenant,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch tenant",
    });
  }
});

// Create a tenant
router.post(
  "/",
  authenticate,
  authorize("SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
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