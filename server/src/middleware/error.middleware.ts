import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/client.js";
import { env } from "../config/env.js";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (env.NODE_ENV !== "production") {
  console.error(err);
}

  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return res.status(409).json({
          success: false,
          message: "A record with this value already exists",
        });

      case "P2025":
        return res.status(404).json({
          success: false,
          message: "Record not found",
        });

      default:
        return res.status(400).json({
          success: false,
          message: "Database request failed",
        });
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: "Invalid database request",
    });
  }

  if (err instanceof SyntaxError) {
    return res.status(400).json({
      success: false,
      message: "Invalid JSON payload",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};