import { z } from "zod";

// Skema registrasi publik
// Keamanan Mass Assignment: field 'role' sengaja ditiadakan dari skema ini
export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Nama lengkap minimal 3 karakter")
    .max(100, "Nama lengkap maksimal 100 karakter"),
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .max(150, "Email terlalu panjang")
    .toLowerCase(),
  password: z
    .string()
    .min(10, "Password minimal 10 karakter")
    .max(72, "Password maksimal 72 karakter (sesuai limit standar Bcrypt)")
    .refine((val) => /[a-zA-Z]/.test(val) && /[0-9]/.test(val), {
      message: "Password wajib mengombinasikan minimal satu huruf dan satu angka.",
    }),
});

// Skema login
export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Format email tidak valid")
    .toLowerCase(),
  password: z
    .string()
    .min(1, "Password tidak boleh kosong"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
