import { Router } from "express";
import prisma from "../lib/prisma.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";

const router = Router();

/**
 * @swagger
 * /api/audit-logs:
 *   get:
 *     summary: Get tenant audit logs
 *     tags: [Audit Logs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: action
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by audit action
 *       - in: query
 *         name: userId
 *         required: false
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *     responses:
 *       200:
 *         description: Audit logs retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
// Get audit logs for the current tenant
router.get(
  "/",
  authenticate,
  authorize("ADMIN", "SUPER_ADMIN"),
  async (req: AuthRequest, res) => {
    try {
      const tenantId = req.user!.tenantId;

      const page = Math.max(
        Number(req.query.page) || 1,
        1
      );

      const limit = Math.min(
        Math.max(Number(req.query.limit) || 20, 1),
        100
      );

      const skip = (page - 1) * limit;

      const action =
        typeof req.query.action === "string"
          ? req.query.action
          : undefined;

      const userId =
        typeof req.query.userId === "string"
          ? req.query.userId
          : undefined;

      const where = {
        tenantId,
        ...(action ? { action } : {}),
        ...(userId ? { userId } : {}),
      };

      const [logs, total] = await prisma.$transaction([
        prisma.auditLog.findMany({
          where,
          orderBy: {
            createdAt: "desc",
          },
          skip,
          take: limit,
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        }),

        prisma.auditLog.count({
          where,
        }),
      ]);

      return res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      console.error(error);

      return res.status(500).json({
        success: false,
        message: "Failed to fetch audit logs",
      });
    }
  }
);

export default router;