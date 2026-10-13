import { Request, Response, NextFunction } from "express";

type PrismaError = {
  code?: string;
};

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error(error);

  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const prismaError = error as PrismaError;

    if (prismaError.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A record with this value already exists",
      });
    }
  }

  const isProduction = process.env.NODE_ENV === "production";

  return res.status(500).json({
    success: false,
    message: isProduction
      ? "Internal server error"
      : error instanceof Error
        ? error.message
        : "Internal server error",
  });
};