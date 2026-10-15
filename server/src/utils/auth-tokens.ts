import jwt from "jsonwebtoken";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "./refresh-token.js";
import { env } from "../config/env.js";

interface AccessTokenPayload {
  userId: string;
  tenantId: string;
  role: string;
  tokenVersion: number;
}

export const generateAccessToken = (
  payload: AccessTokenPayload
): string => {
  return jwt.sign(
    payload,
   env.JWT_SECRET,
    {
      expiresIn: "15m",
    }
  );
};

export const generateRefreshTokenPair = () => {
  const refreshToken = generateRefreshToken();

  return {
    refreshToken,
    refreshTokenHash: hashRefreshToken(refreshToken),
  };
};