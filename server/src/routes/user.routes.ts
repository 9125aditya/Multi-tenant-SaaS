import { Router } from "express";
import prisma from "../lib/prisma.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

// Get all users in the current tenant
router.get("/", authenticate, async (req: AuthRequest, res) => {
  try {
    const users = await prisma.user.findMany({
      where: {
        tenantId: req.user!.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
});

// Get a single user in the current tenant
router.get("/:id", authenticate, async (req: AuthRequest, res) => {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
});

// Update a user in the current tenant
router.patch("/:id", authenticate, authorize("ADMIN", "SUPER_ADMIN"), async (req: AuthRequest, res) => {
  try {
  const id = req.params.id as string;
    const { name, email, role } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        id,
        tenantId: req.user!.tenantId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const updateData: {
      name?: string;
      email?: string;
      role?: "SUPER_ADMIN" | "ADMIN" | "MANAGER" | "USER";
    } = {};

    if (name) {
      updateData.name = name;
    }

    if (email) {
      updateData.email = email;
    }

    if (role) {
  if (role === "SUPER_ADMIN" && req.user!.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      message: "Only SUPER_ADMIN can assign SUPER_ADMIN role",
    });
  }

  updateData.role = role;
}

    const user = await prisma.user.update({
      where: {
        id,
      },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
});

// Delete a user in the current tenant
router.delete(
  "/:id",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const id = req.params.id as string;

      const existingUser = await prisma.user.findFirst({
        where: {
          id,
          tenantId: req.user!.tenantId,
        },
      });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      await prisma.user.delete({
        where: {
          id,
        },
      });

      return res.status(200).json({
        success: true,
        message: "User deleted successfully",
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to delete user",
      });
    }
  }
);

export default router;