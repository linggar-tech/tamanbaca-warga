"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { Role } from "@prisma/client";

export type MemberActionResult = {
  success: boolean;
  message?: string;
};

/**
 * Server Action: Buka Kunci Akun Warga (Reset Brute-force Lockout)
 */
export async function resetUserLockoutAction(userId: string): Promise<MemberActionResult> {
  try {
    const admin = await requireAdmin();

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { success: false, message: "Pengguna tidak ditemukan." };
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: 0,
        lockedUntil: null,
      },
    });

    await createAuditLog({
      userId: admin.id,
      action: "ACCOUNT_UNLOCKED_BY_ADMIN",
      entity: "User",
      entityId: userId,
      details: `Admin membuka status penguncian akun untuk: ${targetUser.name} (${targetUser.email})`,
    });

    revalidatePath("/admin/anggota");
    revalidatePath("/admin/audit-log");

    return {
      success: true,
      message: `Status kunci akun untuk "${targetUser.name}" berhasil di-reset. Pengguna dapat login kembali.`,
    };
  } catch (error: any) {
    console.error("[RESET LOCKOUT ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat membuka kunci akun.",
    };
  }
}

/**
 * Server Action: Aktifkan / Nonaktifkan Akun Pengguna
 */
export async function toggleUserStatusAction(userId: string): Promise<MemberActionResult> {
  try {
    const admin = await requireAdmin();

    // Mencegah admin menonaktifkan dirinya sendiri
    if (admin.id === userId) {
      return {
        success: false,
        message: "Anda tidak dapat menonaktifkan akun administrator Anda sendiri.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return { success: false, message: "Pengguna tidak ditemukan." };
    }

    const newActiveState = !targetUser.isActive;

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: newActiveState },
    });

    // Jika akun dinonaktifkan, cabut seluruh sesi aktif di database
    if (!newActiveState) {
      await prisma.session.deleteMany({
        where: { userId },
      });
    }

    const actionText = newActiveState ? "mengaktifkan kembali" : "menonaktifkan";

    await createAuditLog({
      userId: admin.id,
      action: newActiveState ? "ACCOUNT_ACTIVATED" : "ACCOUNT_DEACTIVATED",
      entity: "User",
      entityId: userId,
      details: `Admin ${actionText} akun: ${targetUser.name} (${targetUser.email})`,
    });

    revalidatePath("/admin/anggota");
    revalidatePath("/admin/audit-log");

    return {
      success: true,
      message: `Akun "${targetUser.name}" berhasil ${newActiveState ? "diaktifkan" : "dinonaktifkan"}.`,
    };
  } catch (error: any) {
    console.error("[TOGGLE STATUS ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat mengubah status akun.",
    };
  }
}
