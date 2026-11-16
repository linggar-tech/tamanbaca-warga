import { z } from "zod";

const currentYear = new Date().getFullYear();

// Host gambar eksternal yang diizinkan sesuai direktif img-src pada Content Security Policy (CSP)
export const ALLOWED_COVER_HOSTS = ["images.unsplash.com", "covers.openlibrary.org"];

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
      (val) => {
        if (!val) return true;
        // Izinkan path upload lokal atau data URI
        if (val.startsWith("/uploads/covers/") || val.startsWith("data:image/")) {
          return true;
        }
        // Jika URL eksternal HTTPS, validasi hostname terhadap whitelist CSP
        if (val.startsWith("https://")) {
          try {
            const url = new URL(val);
            return ALLOWED_COVER_HOSTS.includes(url.hostname.toLowerCase());
          } catch {
            return false;
          }
        }
        return false;
      },
      {
        message:
          "URL sampul eksternal hanya diizinkan dari domain tepercaya (images.unsplash.com atau covers.openlibrary.org) sesuai kebijakan CSP.",
      }
    )
    .optional()
    .or(z.literal("")),
});

export type BookInput = z.infer<typeof bookSchema>;
