import jwt from "jsonwebtoken";
import {
  generateRefreshToken,
  hashRefreshToken,
} from "./refresh-token.js";

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
    process.env.JWT_SECRET!,
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