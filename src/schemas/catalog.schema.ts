import { z } from "zod";

export const catalogQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .max(100, "Kata kunci pencarian maksimal 100 karakter")
    .optional()
    .default(""),
  category: z
    .string()
    .trim()
    .max(50)
    .optional()
    .default(""),
  page: z.coerce
    .number()
    .int()
    .min(1, "Nomor halaman minimal 1")
    .default(1),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(50)
    .default(8),
});

export type CatalogQueryInput = z.infer<typeof catalogQuerySchema>;
