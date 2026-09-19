import { z } from "zod";

export const createTenantSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Slug can only contain lowercase letters, numbers, and hyphens"
    ),
});

export const updateTenantSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    slug: z
      .string()
      .min(2, "Slug must be at least 2 characters")
      .regex(
        /^[a-z0-9-]+$/,
        "Slug can only contain lowercase letters, numbers, and hyphens"
      )
      .optional(),
  })
  .refine(
    (data) =>
      data.name !== undefined ||
      data.slug !== undefined,
    {
      message: "At least one field is required",
    }
  );