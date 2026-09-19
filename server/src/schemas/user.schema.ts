import { z } from "zod";

export const updateUserSchema = z
  .object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    role: z.enum(["SUPER_ADMIN", "ADMIN", "MANAGER", "USER"]).optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.email !== undefined ||
      data.role !== undefined,
    {
      message: "At least one field is required",
    }
  );