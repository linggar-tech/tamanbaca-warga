import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { Role } from "@prisma/client";

export const SESSION_COOKIE_NAME = "tb_session_token";
export const SESSION_DURATION_DAYS = 7;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

/**
 * Membuat sesi baru di database dan mengembalikan sessionId.
 */
export async function createSession(userId: string): Promise<{ id: string; expiresAt: Date }> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

  const session = await prisma.session.create({
    data: {
      userId,
      expiresAt,
    },
  });

  return session;
}

/**
 * Menyimpan session token ke HTTP Cookie dengan atribut keamanan tinggi.
 * - HttpOnly: JavaScript client tidak dapat membaca cookie (kebal XSS credential theft)
 * - Secure: Hanya dikirim via HTTPS di production
 * - SameSite=Lax: Mencegah serangan CSRF antar-domain
 */
export async function setSessionCookie(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies();
  const isSecure =
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_APP_URL?.startsWith("https://");

  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

/**
 * Menghapus sesi dari database dan mencabut cookie (Logout).
 */
export async function destroySession() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (sessionId) {
    try {
      await prisma.session.delete({
        where: { id: sessionId },
      });
    } catch {
      // Abaikan jika sesi sudah terhapus
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
};

/**
 * Mengambil data pengguna aktif dari sesi saat ini.
 * Memvalidasi apakah sesi masih berlaku, akun aktif, dan tidak sedang dikunci.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!sessionId) return null;

  try {
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
            lockedUntil: true,
          },
        },
      },
    });

    if (!session) return null;

    // Periksa apakah sesi telah kedaluwarsa
    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: sessionId } }).catch(() => {});
      cookieStore.delete(SESSION_COOKIE_NAME);
      return null;
    }

    // Periksa status akun user
    if (!session.user.isActive) {
      return null;
    }

    // Periksa apakah akun sedang dikunci
    if (session.user.lockedUntil && session.user.lockedUntil > new Date()) {
      return null;
    }

    return {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      role: session.user.role,
      isActive: session.user.isActive,
    };
  } catch (error) {
    console.error("[AUTH ERROR] Gagal memverifikasi sesi:", error);
    return null;
  }
}

/**
 * Keamanan Akses: Memastikan pengguna sudah login (Authenticated).
 * Jika belum login, melempar error unauthorized.
 */
export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Anda harus login untuk mengakses fitur ini.");
  }
  return user;
}

/**
 * Keamanan Akses Berlapis (Defense-in-depth): Memastikan pengguna berhak sebagai ADMIN.
 * Melindungi Server Actions dan Route Handlers agar tidak dapat diakses oleh MEMBER maupun publik.
 */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireAuth();
  if (user.role !== Role.ADMIN) {
    throw new Error("FORBIDDEN: Anda tidak memiliki hak akses administrator.");
  }
  return user;
}

/**
 * Menangani logika kegagalan login dan penguncian akun (Brute-Force Protection).
 * Integritas Konkurensi: Menggunakan operasi atomik PostgreSQL { increment: 1 }
 * untuk mencegah serangan race condition (TOCTOU) saat penyerang mengirimkan
 * banyak request login simultan.
 */
export async function handleFailedLogin(userId: string) {
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: { increment: 1 },
    },
    select: { failedLoginCount: true },
  });

  const newCount = updated.failedLoginCount;
  const isLocked = newCount >= MAX_FAILED_ATTEMPTS;
  const lockedUntil = isLocked
    ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000)
    : null;

  if (isLocked) {
    await prisma.user.update({
      where: { id: userId },
      data: { lockedUntil },
    });
  }

  return { isLocked, lockedUntil, attemptsLeft: Math.max(0, MAX_FAILED_ATTEMPTS - newCount) };
}

/**
 * Mereset status kegagalan login saat login berhasil.
 */
export async function resetFailedLogin(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      failedLoginCount: 0,
      lockedUntil: null,
    },
  });
}
