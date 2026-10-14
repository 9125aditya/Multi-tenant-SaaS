import { Router } from "express";
import bcrypt from "bcrypt";
import {
  generateAccessToken,
  generateRefreshTokenPair,
} from "../utils/auth-tokens.js";
import prisma from "../lib/prisma.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  refreshTokenSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema.js";
import {
  generateEmailVerificationToken,
  hashEmailVerificationToken,
} from "../utils/email-verification-token.js";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "../utils/password-reset-token.js";
import { hashRefreshToken } from "../utils/refresh-token.js";
import {
  authenticate,
  AuthRequest,
} from "../middleware/auth.middleware.js";
import { authorize } from "../middleware/role.middleware.js";
import { authRateLimiter } from "../middleware/rate-limit.middleware.js";
import { createAuditLog } from "../utils/audit-log.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| REGISTER
|--------------------------------------------------------------------------
*/

router.post(
  "/register",
  authRateLimiter,
  async (req, res, next) => {
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

      await createAuditLog({
  tenantId: user.tenantId,
  userId: user.id,
  action: "USER_CREATED",
  entity: "User",
  entityId: user.id,
  metadata: {
    role: user.role,
  },
});

      // 6. Generate email verification token
      const verificationToken =
        generateEmailVerificationToken();

      const verificationTokenHash =
        hashEmailVerificationToken(
          verificationToken
        );

      const verificationExpiresAt = new Date(
        Date.now() + 24 * 60 * 60 * 1000
      );

      await prisma.emailVerificationToken.create({
        data: {
          tokenHash: verificationTokenHash,
          userId: user.id,
          tenantId: user.tenantId,
          expiresAt: verificationExpiresAt,
        },
      });

      const verificationUrl =
        `http://localhost:3000/api/auth/verify-email?token=${verificationToken}`;

      console.log(
        "Email verification URL:",
        verificationUrl
      );

      // 7. Never return password
      const {
        password: _,
        ...userWithoutPassword
      } = user;

      return res.status(201).json({
        success: true,
        message: "User registered successfully",
        data: userWithoutPassword,
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| LOGIN
|--------------------------------------------------------------------------
*/

router.post(
  "/login",
  authRateLimiter,
  async (req, res, next) => {
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

      const {
        email,
        password,
        tenantId,
      } = result.data;

      // 2. Find user inside tenant
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

      // 4. Require verified email
      if (!user.emailVerifiedAt) {
        return res.status(403).json({
          success: false,
          message:
            "Please verify your email before logging in",
        });
      }
      await createAuditLog({
  tenantId: user.tenantId,
  userId: user.id,
  action: "LOGIN",
  entity: "User",
  entityId: user.id,
});
      // 5. Generate access token
      const accessToken = generateAccessToken({
        userId: user.id,
        tenantId: user.tenantId,
        role: user.role,
        tokenVersion: user.tokenVersion,
      });


      // 6. Generate refresh token
      const {
        refreshToken,
        refreshTokenHash,
      } = generateRefreshTokenPair();

      // 7. Store refresh session
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

      // 8. Return tokens
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
  }
);

/*
|--------------------------------------------------------------------------
| REFRESH TOKEN
|--------------------------------------------------------------------------
*/

router.post(
  "/refresh",
  authRateLimiter,
  async (req, res, next) => {
    try {
      // 1. Validate request
      const result =
        refreshTokenSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const { refreshToken } = result.data;

      // 2. Hash provided refresh token
      const tokenHash =
        hashRefreshToken(refreshToken);

      // 3. Find refresh session
      const session =
        await prisma.refreshSession.findUnique({
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

      // 4. Check revoked
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
      if (
        session.tokenVersion !==
        user.tokenVersion
      ) {
        return res.status(401).json({
          success: false,
          message: "Session has been invalidated",
        });
      }

      // 8. Generate new refresh token
      const {
        refreshToken: newRefreshToken,
        refreshTokenHash:
          newRefreshTokenHash,
      } = generateRefreshTokenPair();

      const newExpiresAt = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      );

      // 9. Revoke old session and create new one
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
  }
);

/*
|--------------------------------------------------------------------------
| VERIFY EMAIL
|--------------------------------------------------------------------------
*/

router.get(
  "/verify-email",
  async (req, res, next) => {
    try {
      const token = req.query.token;

      if (
        typeof token !== "string" ||
        !token
      ) {
        return res.status(400).json({
          success: false,
          message: "Verification token is required",
        });
      }

      const tokenHash =
        hashEmailVerificationToken(token);

      const verificationToken =
        await prisma.emailVerificationToken.findUnique({
          where: {
            tokenHash,
          },
        });

      if (!verificationToken) {
        return res.status(400).json({
          success: false,
          message: "Invalid verification token",
        });
      }

      if (verificationToken.usedAt) {
        return res.status(400).json({
          success: false,
          message:
            "Verification token has already been used",
        });
      }

      if (
        verificationToken.expiresAt <= new Date()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Verification token has expired",
        });
      }

      const user = await prisma.user.findFirst({
        where: {
          id: verificationToken.userId,
          tenantId: verificationToken.tenantId,
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User no longer exists",
        });
      }

      if (user.emailVerifiedAt) {
        return res.status(200).json({
          success: true,
          message: "Email is already verified",
        });
      }

   await prisma.$transaction([
  prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerifiedAt: new Date(),
    },
  }),

  prisma.emailVerificationToken.update({
    where: {
      id: verificationToken.id,
    },
    data: {
      usedAt: new Date(),
    },
  }),

  prisma.auditLog.create({
    data: {
      tenantId: verificationToken.tenantId,
      userId: verificationToken.userId,
      action: "EMAIL_VERIFIED",
      entity: "User",
      entityId: verificationToken.userId,
    },
  }),
]);

      return res.status(200).json({
        success: true,
        message: "Email verified successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESEND VERIFICATION
|--------------------------------------------------------------------------
*/

router.post(
  "/resend-verification",
  authRateLimiter,
  async (req, res, next) => {
    try {
      const result =
        resendVerificationSchema.safeParse(
          req.body
        );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const { email, tenantId } =
        result.data;

      const user = await prisma.user.findFirst({
        where: {
          email,
          tenantId,
        },
      });

      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            "If an account exists, a verification email will be sent",
        });
      }

      if (user.emailVerifiedAt) {
        return res.status(400).json({
          success: false,
          message: "Email is already verified",
        });
      }

      const verificationToken =
        generateEmailVerificationToken();

      const verificationTokenHash =
        hashEmailVerificationToken(
          verificationToken
        );

      const verificationExpiresAt =
        new Date(
          Date.now() +
            24 * 60 * 60 * 1000
        );

      await prisma.$transaction([
        prisma.emailVerificationToken.updateMany({
          where: {
            userId: user.id,
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        }),

        prisma.emailVerificationToken.create({
          data: {
            tokenHash:
              verificationTokenHash,
            userId: user.id,
            tenantId: user.tenantId,
            expiresAt:
              verificationExpiresAt,
          },
        }),
      ]);

      const verificationUrl =
        `http://localhost:3000/api/auth/verify-email?token=${verificationToken}`;

      console.log(
        "Email verification URL:",
        verificationUrl
      );

      return res.status(200).json({
        success: true,
        message:
          "If an account exists, a verification email will be sent",
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| LOGOUT
|--------------------------------------------------------------------------
*/

router.post(
  "/logout",
  async (req, res, next) => {
    try {
      // 1. Validate request
      const result =
        refreshTokenSchema.safeParse(
          req.body
        );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const { refreshToken } =
        result.data;

      // 2. Hash refresh token
      const tokenHash =
        hashRefreshToken(refreshToken);

      // 3. Find session
      const session =
        await prisma.refreshSession.findUnique({
          where: {
            tokenHash,
          },
        });

      // 4. Don't reveal whether token exists
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

        // 6. Create audit log
        await createAuditLog({
          tenantId: session.tenantId,
          userId: session.userId,
          action: "LOGOUT",
          entity: "User",
          entityId: session.userId,
        });
      }

      // 7. Success
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (error) {
      next(error);
    }
  }
);
/*
|--------------------------------------------------------------------------
| CHANGE PASSWORD
|--------------------------------------------------------------------------
*/

router.patch(
  "/change-password",
  authenticate,
  async (req: AuthRequest, res, next) => {
    try {
      // 1. Validate request
      const result =
        changePasswordSchema.safeParse(
          req.body
        );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const {
        currentPassword,
        newPassword,
      } = result.data;

      // 2. Find authenticated user
      const user =
        await prisma.user.findFirst({
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
      const passwordMatch =
        await bcrypt.compare(
          currentPassword,
          user.password
        );

      if (!passwordMatch) {
        return res.status(401).json({
          success: false,
          message:
            "Current password is incorrect",
        });
      }

      // 4. Prevent same password
      const samePassword =
        await bcrypt.compare(
          newPassword,
          user.password
        );

      if (samePassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from current password",
        });
      }

      // 5. Hash new password
      const hashedPassword =
        await bcrypt.hash(
          newPassword,
          10
        );

      // 6. Update password
      // Also invalidate existing sessions.
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

/*
|--------------------------------------------------------------------------
| FORGOT PASSWORD
|--------------------------------------------------------------------------
*/

router.post(
  "/forgot-password",
  authRateLimiter,
  async (req, res, next) => {
    try {
      // 1. Validate request
      const result =
        forgotPasswordSchema.safeParse(
          req.body
        );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const {
        email,
        tenantId,
      } = result.data;

      // 2. Find user inside tenant
      const user =
        await prisma.user.findFirst({
          where: {
            email,
            tenantId,
          },
        });

      /*
       * Always return the same response.
       *
       * This prevents account enumeration.
       */
      if (!user) {
        return res.status(200).json({
          success: true,
          message:
            "If an account exists, a password reset link will be sent",
        });
      }

      // 3. Generate reset token
      const resetToken =
        generatePasswordResetToken();

      // 4. Hash token before storing
      const resetTokenHash =
        hashPasswordResetToken(
          resetToken
        );

      // 5. Token expires in 1 hour
      const resetExpiresAt =
        new Date(
          Date.now() +
            60 * 60 * 1000
        );

      // 6. Invalidate old tokens
      //    and create the new token.
      await prisma.$transaction([
        prisma.passwordResetToken.updateMany({
          where: {
            userId: user.id,
            usedAt: null,
          },
          data: {
            usedAt: new Date(),
          },
        }),

        prisma.passwordResetToken.create({
          data: {
            tokenHash:
              resetTokenHash,
            userId: user.id,
            tenantId:
              user.tenantId,
            expiresAt:
              resetExpiresAt,
          },
        }),
      ]);

      // 7. Temporary development URL
      //
      // In production this will be sent through
      // an email service instead.
      const resetUrl =
        `http://localhost:3000/api/auth/reset-password?token=${resetToken}`;

      console.log(
        "Password reset URL:",
        resetUrl
      );

      // 8. Generic response
      return res.status(200).json({
        success: true,
        message:
          "If an account exists, a password reset link will be sent",
      });
    } catch (error) {
      next(error);
    }
  }
);

/*
|--------------------------------------------------------------------------
| RESET PASSWORD
|--------------------------------------------------------------------------
*/

router.post(
  "/reset-password",
  authRateLimiter,
  async (req, res, next) => {
    try {
      // 1. Validate request
      const result = resetPasswordSchema.safeParse(req.body);

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Invalid input",
          errors: result.error.issues,
        });
      }

      const { token, newPassword } = result.data;

      // 2. Hash the raw token
      const tokenHash = hashPasswordResetToken(token);

      // 3. Find reset token
      const resetToken =
        await prisma.passwordResetToken.findUnique({
          where: {
            tokenHash,
          },
        });

      if (!resetToken) {
        return res.status(400).json({
          success: false,
          message: "Invalid password reset token",
        });
      }

      // 4. Check if token has already been used
      if (resetToken.usedAt) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset token has already been used",
        });
      }

      // 5. Check token expiry
      if (resetToken.expiresAt <= new Date()) {
        return res.status(400).json({
          success: false,
          message: "Password reset token has expired",
        });
      }

      // 6. Find user using both userId and tenantId
      const user = await prisma.user.findFirst({
        where: {
          id: resetToken.userId,
          tenantId: resetToken.tenantId,
        },
      });

      if (!user) {
        return res.status(400).json({
          success: false,
          message: "User no longer exists",
        });
      }

      // 7. Prevent using the same password
      const samePassword = await bcrypt.compare(
        newPassword,
        user.password
      );

      if (samePassword) {
        return res.status(400).json({
          success: false,
          message:
            "New password must be different from current password",
        });
      }

      // 8. Hash new password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        10
      );

      /*
       * 9. Update password, revoke sessions,
       *    consume reset token, and create audit log
       */
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: {
            id: user.id,
          },
          data: {
            password: hashedPassword,
            tokenVersion: {
              increment: 1,
            },
          },
        });

        await tx.refreshSession.updateMany({
          where: {
            userId: user.id,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });

        await tx.passwordResetToken.update({
          where: {
            id: resetToken.id,
          },
          data: {
            usedAt: new Date(),
          },
        });

        await tx.auditLog.create({
          data: {
            tenantId: user.tenantId,
            userId: user.id,
            action: "PASSWORD_RESET",
            entity: "User",
            entityId: user.id,
          },
        });
      });

      // 10. Success
      return res.status(200).json({
        success: true,
        message:
          "Password reset successfully. Please log in again.",
      });
    } catch (error) {
      next(error);
    }
  }
);
/*
|--------------------------------------------------------------------------
| CURRENT USER
|--------------------------------------------------------------------------
*/

router.get(
  "/me",
  authenticate,
  async (req: AuthRequest, res) => {
    return res.status(200).json({
      success: true,
      message: "Authenticated successfully",
      user: req.user,
    });
  }
);

export default router;