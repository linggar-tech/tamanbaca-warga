import { z } from "zod";

const currentYear = new Date().getFullYear();

export const bookSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Judul buku minimal 2 karakter")
    .max(200, "Judul buku maksimal 200 karakter"),
  author: z
    .string()
    .trim()
    .min(2, "Nama pengarang minimal 2 karakter")
    .max(150, "Nama pengarang maksimal 150 karakter"),
  publisher: z
    .string()
    .trim()
    .min(2, "Nama penerbit minimal 2 karakter")
    .max(150, "Nama penerbit maksimal 150 karakter"),
  year: z.coerce
    .number()
    .int("Tahun harus berupa bilangan bulat")
    .min(1800, "Tahun terbit tidak valid (minimal 1800)")
    .max(currentYear + 1, `Tahun terbit maksimal ${currentYear + 1}`),
  isbn: z
    .string()
    .trim()
    .max(30, "ISBN maksimal 30 karakter")
    .optional()
    .or(z.literal("")),
  stock: z.coerce
    .number()
    .int("Stok harus berupa bilangan bulat")
    .min(0, "Stok buku tidak boleh negatif"),
  categoryId: z
    .string()
    .trim()
    .min(1, "Kategori buku wajib dipilih"),
  description: z
    .string()
    .trim()
    .max(2000, "Deskripsi buku maksimal 2000 karakter")
    .optional()
    .or(z.literal("")),
  coverUrl: z
    .string()
    .trim()
    .max(500, "URL sampul terlalu panjang")
    .refine(
      (val) =>
        !val ||
        val.startsWith("https://") ||
        val.startsWith("/uploads/covers/"),
      {
        message: "URL sampul harus menggunakan protokol HTTPS yang aman atau bersumber dari upload lokal.",
      }
    )
    .optional()
    .or(z.literal("")),
});

export type BookInput = z.infer<typeof bookSchema>;
