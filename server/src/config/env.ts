import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
 JWT_SECRET: z
  .string()
  .min(32, "JWT_SECRET must be at least 32 characters"),
  FRONTEND_URL: z.string().url(),

  NODE_ENV: z
  .enum(["development", "test", "production"])
  .default("development"),

  PORT: z.coerce.number().int().positive().default(3000),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error("❌ Invalid environment variables:");
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;