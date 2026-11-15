"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  createSession,
  setSessionCookie,
  destroySession,
  handleFailedLogin,
  resetFailedLogin,
  getCurrentUser,
} from "@/lib/auth";
import { registerSchema, loginSchema } from "@/schemas/auth.schema";
import { checkRateLimit } from "@/lib/rate-limit";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

export type AuthActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// Mengambil IP address klien untuk logging dan rate limiting
async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return headerList.get("x-real-ip") || "127.0.0.1";
}

/**
 * Server Action: Registrasi Member Baru
 * Keamanan:
 * - Anti Mass Assignment: role selalu dipaksa MEMBER di level kode backend
 * - Validasi Zod di server
 * - Hashing bcrypt cost 12
 * - Rate limiting pendaftaran akun
 */
export async function registerAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const clientIp = await getClientIp();

  // 1. Rate Limiting: Maksimal 5 registrasi per 10 menit per IP
  const rateLimit = checkRateLimit(`register_${clientIp}`, {
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.success) {
    return {
      success: false,
      message: "Terlalu banyak permintaan pendaftaran. Silakan coba lagi beberapa saat lagi.",
    };
  }

  // 2. Validasi Input dengan Zod
  const rawData = {
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = registerSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data pendaftaran tidak valid.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { name, email, password } = parsed.data;

  try {
    // 3. Cek keunikan email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        message: "Email sudah terdaftar. Silakan gunakan email lain atau login.",
      };
    }

    // 4. Hash Password dengan bcrypt cost 12
    const passwordHash = await hashPassword(password);

    // 5. Simpan user baru (Role strictly MEMBER)
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.MEMBER, // Wajib MEMBER, mencegah eskalasi hak akses (Mass Assignment)
        isActive: true,
      },
    });

    // 6. Catat AuditLog
    await createAuditLog({
      userId: newUser.id,
      action: "REGISTER_SUCCESS",
      entity: "User",
      entityId: newUser.id,
      ipAddress: clientIp,
      details: `Pendaftaran berhasil untuk email: ${email}`,
    });

    return {
      success: true,
      message: "Pendaftaran berhasil! Silakan masuk dengan akun baru Anda.",
    };
  } catch (error) {
    console.error("[REGISTER ERROR]", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal pada server. Silakan coba lagi.",
    };
  }
}

/**
 * Server Action: Login Pengguna
 * Keamanan:
 * - Rate limiting per IP (maksimal 5 kali percobaan per menit)
 * - Pesan error generik untuk mencegah penemuan email (User Enumeration)
 * - Penguncian akun sementara (15 menit) setelah 5 kali gagal berturut-turut
 * - Pembuatan database session dengan cookie HttpOnly & SameSite=Lax
 * - Pencatatan AuditLog untuk audit keamanan
 */
export async function loginAction(
  _prevState: AuthActionResult | null,
  formData: FormData
): Promise<AuthActionResult> {
  const clientIp = await getClientIp();

  // 1. Rate Limiting per IP
  const rateLimit = checkRateLimit(`login_${clientIp}`, {
    limit: 5,
    windowMs: 60 * 1000,
  });

  if (!rateLimit.success) {
    return {
      success: false,
      message: "Terlalu banyak percobaan login gagal. Mohon tunggu 1 menit.",
    };
  }

  // 2. Validasi input dengan Zod
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
  };

  const parsed = loginSchema.safeParse(rawData);
  if (!parsed.success) {
    return {
      success: false,
      message: "Email atau password tidak sesuai format.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { email, password } = parsed.data;

  try {
    // 3. Query pengguna berdasarkan email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Keamanan Anti-Timing Attack (User Enumeration Defense):
    // Pre-computed dummy hash bcrypt cost 12.
    // Jika akun tidak ditemukan, kita tetap menjalankan verifyPassword(password, DUMMY_HASH)
    // agar durasi respons CPU identik (~250ms) dengan akun yang terdaftar.
    const DUMMY_HASH = "$2a$12$e8rGgqOcvwzF38p1qgPj7ODQvXJ5E8Q7G3aC9p5m2K5F1w9.lF0.e";

    if (!user) {
      await verifyPassword(password, DUMMY_HASH);

      await createAuditLog({
        action: "LOGIN_FAILED",
        entity: "User",
        ipAddress: clientIp,
        details: `Upaya login dengan email yang tidak terdaftar: ${email}`,
      });
      return {
        success: false,
        message: "Email atau password yang Anda masukkan salah.",
      };
    }

    // 4. Periksa apakah akun dinonaktifkan
    if (!user.isActive) {
      await verifyPassword(password, DUMMY_HASH);
      return {
        success: false,
        message: "Akun Anda telah dinonaktifkan oleh administrator.",
      };
    }

    // 5. Periksa apakah akun sedang dikunci (Account Lockout)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await verifyPassword(password, DUMMY_HASH);
      const remainingMinutes = Math.ceil(
        (user.lockedUntil.getTime() - Date.now()) / (60 * 1000)
      );
      return {
        success: false,
        message: `Akun terkunci sementara karena 5x gagal login. Coba lagi dalam ${remainingMinutes} menit.`,
      };
    }

    // 6. Verifikasi kecocokan password
    const isPasswordValid = await verifyPassword(password, user.passwordHash);

    if (!isPasswordValid) {
      // Catat kegagalan dan update counter penguncian secara atomik di database
      const lockoutStatus = await handleFailedLogin(user.id);

      if (lockoutStatus.isLocked) {
        await createAuditLog({
          userId: user.id,
          action: "ACCOUNT_LOCKED",
          entity: "User",
          entityId: user.id,
          ipAddress: clientIp,
          details: `Akun dikunci otomatis selama 15 menit setelah 5 kali gagal login.`,
        });

        return {
          success: false,
          message: "Akun Anda telah dikunci sementara selama 15 menit karena 5 kali gagal masuk.",
        };
      }

      await createAuditLog({
        userId: user.id,
        action: "LOGIN_FAILED",
        entity: "User",
        entityId: user.id,
        ipAddress: clientIp,
        details: `Password salah. Sisa percobaan sebelum akun dikunci: ${lockoutStatus.attemptsLeft}`,
      });

      return {
        success: false,
        message: "Email atau password yang Anda masukkan salah.",
      };
    }

    // 7. Login Berhasil: Reset kegagalan login
    await resetFailedLogin(user.id);

    // Keamanan Session Fixation & Stale Tokens: Cabut seluruh sesi lama user ini di database
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    // 8. Buat Sesi Baru di Database & Tetapkan Cookie HttpOnly
    const session = await createSession(user.id);
    await setSessionCookie(session.id, session.expiresAt);

    // 9. Catat Log Login Berhasil
    await createAuditLog({
      userId: user.id,
      action: "LOGIN_SUCCESS",
      entity: "User",
      entityId: user.id,
      ipAddress: clientIp,
      details: `Login berhasil sebagai ${user.role}`,
    });

    return {
      success: true,
      message: user.role === Role.ADMIN ? "/admin/dashboard" : "/member/dashboard",
    };
  } catch (error) {
    console.error("[LOGIN ERROR]", error);
    return {
      success: false,
      message: "Terjadi kesalahan internal. Silakan coba kembali.",
    };
  }
}

/**
 * Server Action: Logout
 * Menghapus sesi dari database dan membersihkan cookie aman
 */
export async function logoutAction() {
  const currentUser = await getCurrentUser();
  const clientIp = await getClientIp();

  if (currentUser) {
    await createAuditLog({
      userId: currentUser.id,
      action: "LOGOUT",
      entity: "User",
      entityId: currentUser.id,
      ipAddress: clientIp,
      details: "Pengguna melakukan logout sesi",
    });
  }

  await destroySession();
  redirect("/login");
}
