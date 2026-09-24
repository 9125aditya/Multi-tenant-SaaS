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

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};