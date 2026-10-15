import { z } from "zod";
import { Router } from "express";
import prisma from "../lib/prisma.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { updateUserSchema } from "../schemas/user.schema.js";
import { createAuditLog } from "../utils/audit-log.js";
import { validate } from "../middleware/validate.middleware.js";


const router = Router();


/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users in the tenant
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
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

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
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

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Update a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Name
 *               email:
 *                 type: string
 *                 format: email
 *                 example: updated@example.com
 *               role:
 *                 type: string
 *                 enum:
 *                   - SUPER_ADMIN
 *                   - ADMIN
 *                   - MANAGER
 *                   - USER
 *                 example: MANAGER
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

// Update a user in the current tenant
router.patch(
  "/:id",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  validate(updateUserSchema),
  async (req: AuthRequest, res) => {
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
        if (
          role === "SUPER_ADMIN" &&
          req.user!.role !== "SUPER_ADMIN"
        ) {
          return res.status(403).json({
            success: false,
            message:
              "Only SUPER_ADMIN can assign SUPER_ADMIN role",
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

      // Audit: user details were updated
      await createAuditLog({
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
        action: "USER_UPDATED",
        entity: "User",
        entityId: user.id,
        metadata: {
          updatedFields: Object.keys(updateData),
        },
      });

      // Audit: user's role was changed
      if (role && existingUser.role !== role) {
        await createAuditLog({
          tenantId: req.user!.tenantId,
          userId: req.user!.userId,
          action: "ROLE_CHANGED",
          entity: "User",
          entityId: user.id,
          metadata: {
            oldRole: existingUser.role,
            newRole: role,
          },
        });
      }

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
  }
);
/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */

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

      // Audit: user was deleted
      await createAuditLog({
        tenantId: req.user!.tenantId,
        userId: req.user!.userId,
        action: "USER_DELETED",
        entity: "User",
        entityId: id,
        metadata: {
          deletedUserEmail: existingUser.email,
          deletedUserName: existingUser.name,
          deletedUserRole: existingUser.role,
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