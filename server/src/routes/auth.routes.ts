import { Router } from "express";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshTokenPair,
} from "../utils/auth-tokens.js";
import prisma from "../lib/prisma.js";
import { 
  registerSchema ,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
 } from "../schemas/auth.schema.js";
 import { hashRefreshToken } from "../utils/refresh-token.js";
 import { authenticate, AuthRequest } from "../middleware/auth.middleware.js";
 import { authorize } from "../middleware/role.middleware.js";

const router = Router();

router.post("/register", async (req, res , next) => {
  try {
    // 1. Validate request
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: result.error.issues,
      });
    }

    const { name, email, password, tenantId } = result.data;

    // 2. Check if tenant exists
    const tenant = await prisma.tenant.findUnique({
      where: {
        id: tenantId,
      },
    });

    if (!tenant) {
      return res.status(404).json({
        success: false,
        message: "Tenant not found",
      });
    }

    // 3. Check if user already exists in this tenant
    const existingUser = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists in this tenant",
      });
    }

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 5. Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        tenantId,
      },
    });

    // 6. Never return the password
    const { password: _, ...userWithoutPassword } = user;

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: userWithoutPassword,
    });
  } catch (error) {
    next(error);
  }
});

router.post("/login", async (req, res , next) => {
  try {
    // 1. Validate request
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: result.error.issues,
      });
    }

    const { email, password, tenantId } = result.data;

    // 2. Find user inside the tenant
    const user = await prisma.user.findUnique({
      where: {
        tenantId_email: {
          tenantId,
          email,
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // 3. Compare password
    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

  // 4. Generate access token
const accessToken = generateAccessToken({
  userId: user.id,
  tenantId: user.tenantId,
  role: user.role,
  tokenVersion: user.tokenVersion,
});

// 5. Generate refresh token
const {
  refreshToken,
  refreshTokenHash,
} = generateRefreshTokenPair();

// 6. Store refresh session
const expiresAt = new Date(
  Date.now() + 7 * 24 * 60 * 60 * 1000
);

await prisma.refreshSession.create({
  data: {
    tokenHash: refreshTokenHash,
    userId: user.id,
    tenantId: user.tenantId,
    tokenVersion: user.tokenVersion,
    expiresAt,
  },
});

// 7. Return tokens
return res.status(200).json({
  success: true,
  message: "Login successful",
  data: {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
  },
});
  } catch (error) {
    next(error);
  }
});

router.post("/refresh", async (req, res, next) => {
  try {
    // 1. Validate request
    const result = refreshTokenSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: result.error.issues,
      });
    }

    const { refreshToken } = result.data;

    // 2. Hash the provided refresh token
    const tokenHash = hashRefreshToken(refreshToken);

    // 3. Find the refresh session
    const session = await prisma.refreshSession.findUnique({
      where: {
        tokenHash,
      },
    });

    if (!session) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // 4. Check if session was revoked
    if (session.revokedAt) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has been revoked",
      });
    }

    // 5. Check expiry
    if (session.expiresAt <= new Date()) {
      return res.status(401).json({
        success: false,
        message: "Refresh token has expired",
      });
    }

    // 6. Get current user
    const user = await prisma.user.findFirst({
      where: {
        id: session.userId,
        tenantId: session.tenantId,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User no longer exists",
      });
    }

    // 7. Check token version
    if (session.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session has been invalidated",
      });
    }

    // 8. Rotate refresh token
    const {
      refreshToken: newRefreshToken,
      refreshTokenHash: newRefreshTokenHash,
    } = generateRefreshTokenPair();

    const newExpiresAt = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    );

    // 9. Revoke old session and create new session
    await prisma.$transaction([
      prisma.refreshSession.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),

      prisma.refreshSession.create({
        data: {
          tokenHash: newRefreshTokenHash,
          userId: user.id,
          tenantId: user.tenantId,
          tokenVersion: user.tokenVersion,
          expiresAt: newExpiresAt,
        },
      }),
    ]);

    // 10. Generate new access token
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      tokenVersion: user.tokenVersion,
    });

    // 11. Return new tokens
    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    // 1. Validate request
    const result = refreshTokenSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid input",
        errors: result.error.issues,
      });
    }

    const { refreshToken } = result.data;

    // 2. Hash refresh token
    const tokenHash = hashRefreshToken(refreshToken);

    // 3. Find session
    const session = await prisma.refreshSession.findUnique({
      where: {
        tokenHash,
      },
    });

    // 4. Don't reveal whether the token exists
    if (!session) {
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    }

    // 5. Revoke session
    if (!session.revokedAt) {
      await prisma.refreshSession.update({
        where: {
          id: session.id,
        },
        data: {
          revokedAt: new Date(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
});

router.patch(
  "/change-password",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      // 1. Validate request
      const result = changePasswordSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const { currentPassword, newPassword } = result.data;

      // 2. Find the authenticated user
      const user = await prisma.user.findFirst({
        where: {
          id: req.user!.userId,
          tenantId: req.user!.tenantId,
        },
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // 3. Verify current password
      const passwordMatch = await bcrypt.compare(
        currentPassword,
        user.password
      );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      // 4. Prevent using the same password
      const samePassword = await bcrypt.compare(
        newPassword,
        user.password
      );

      if (samePassword) {
        return res.status(400).json({
          success: false,
          message: "New password must be different from current password",
        });
      }

      // 5. Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // 6. Update password
      await prisma.$transaction([
  prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      password: hashedPassword,
      tokenVersion: {
        increment: 1,
      },
    },
  }),

  prisma.refreshSession.updateMany({
    where: {
      userId: user.id,
      revokedAt: null,
    },
    data: {
      revokedAt: new Date(),
    },
  }),
]);

      return res.status(200).json({
        success: true,
        message: "Password changed successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get("/me", authenticate, async (req: AuthRequest, res) => {
  return res.status(200).json({
    success: true,
    message: "Authenticated successfully",
    user: req.user,
  });
});



export default router;