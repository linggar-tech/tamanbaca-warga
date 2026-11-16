"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { requireAuth, SESSION_COOKIE_NAME } from "@/lib/auth";
import { hashPassword, verifyPassword, isPasswordStrong } from "@/lib/password";
import { createAuditLog } from "@/lib/audit";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().trim().min(3, "Nama minimal 3 karakter").max(100, "Nama maksimal 100 karakter"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Password saat ini wajib diisi"),
  newPassword: z
    .string()
    .min(10, "Password baru minimal 10 karakter")
    .max(72, "Password baru maksimal 72 karakter (sesuai limit standar Bcrypt)"),
  confirmPassword: z.string().min(1, "Konfirmasi password baru wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Konfirmasi password baru tidak cocok.",
  path: ["confirmPassword"],
});

export type ProfileActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Server Action: Perbarui Profil Pribadi (MEMBER)
 * Anti-IDOR: Selalu menggunakan ID dari requireAuth()
 */
export async function updateProfileAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const user = await requireAuth();

    const parsed = updateProfileSchema.safeParse({
      name: formData.get("name"),
    });

    if (!parsed.success) {
      return {
        success: false,
        message: "Data profil tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name } = parsed.data;

    // Update STRICT pada user aktif dari sesi
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    await createAuditLog({
      userId: user.id,
      action: "PROFILE_UPDATED",
      entity: "User",
      entityId: user.id,
      details: `Pengguna memperbarui nama profil menjadi: ${name}`,
    });

    revalidatePath("/member/profil");
    revalidatePath("/member/dashboard");

    return {
      success: true,
      message: "Nama profil Anda berhasil diperbarui.",
    };
  } catch (error: any) {
    console.error("[UPDATE PROFILE ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memperbarui profil.",
    };
  }
}

/**
 * Server Action: Ubah Password Pribadi (MEMBER)
 * Keamanan:
 * - Anti-IDOR (userId dari sesi)
 * - Verifikasi password lama dengan bcrypt.compare
 * - Validasi kekuatan password baru (min 10 karakter, huruf & angka)
 * - Hash password baru dengan bcrypt cost 12
 */
export async function changePasswordAction(
  _prevState: ProfileActionResult | null,
  formData: FormData
): Promise<ProfileActionResult> {
  try {
    const user = await requireAuth();

    const rawData = {
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    };

    const parsed = changePasswordSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validasi password gagal.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { currentPassword, newPassword } = parsed.data;

    // Validasi kekuatan password baru
    const strengthCheck = isPasswordStrong(newPassword);
    if (!strengthCheck.isValid) {
      return {
        success: false,
        message: strengthCheck.message || "Password baru belum memenuhi kriteria keamanan.",
      };
    }

    // Ambil hash password saat ini
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
    });

    if (!dbUser) {
      return { success: false, message: "Pengguna tidak ditemukan." };
    }

    // Verifikasi kecocokan password lama
    const isCurrentPasswordValid = await verifyPassword(currentPassword, dbUser.passwordHash);
    if (!isCurrentPasswordValid) {
      return {
        success: false,
        message: "Password saat ini yang Anda masukkan salah.",
      };
    }

    // Hash password baru dengan salt cost 12
    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash },
    });

    // Keamanan Manajemen Sesi: Cabut seluruh sesi aktif lain milik pengguna ini
    const cookieStore = await cookies();
    const currentSessionId = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    const deleteWhere: any = { userId: user.id };
    if (currentSessionId) {
      deleteWhere.id = { not: currentSessionId };
    }

    const revokedResult = await prisma.session.deleteMany({
      where: deleteWhere,
    });

    await createAuditLog({
      userId: user.id,
      action: "PASSWORD_CHANGED",
      entity: "User",
      entityId: user.id,
      details: `Pengguna berhasil mengubah password. ${revokedResult.count} sesi aktif lainnya telah dicabut.`,
    });

    return {
      success: true,
      message: "Password Anda berhasil diperbarui. Silakan gunakan password baru pada sesi masuk berikutnya.",
    };
  } catch (error: any) {
    console.error("[CHANGE PASSWORD ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan internal saat mengubah password.",
    };
  }
}
