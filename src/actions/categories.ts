"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { categorySchema } from "@/schemas/category.schema";
import { createAuditLog } from "@/lib/audit";

export type CategoryActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/**
 * Server Action: Tambah Kategori Baru (Khusus ADMIN)
 */
export async function createCategoryAction(
  _prevState: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  try {
    // 1. Verifikasi Hak Akses Berlapis (Defense-in-depth)
    const admin = await requireAdmin();

    // 2. Validasi Input dengan Zod
    const rawData = { name: formData.get("name") };
    const parsed = categorySchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "Data kategori tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name } = parsed.data;

    // 3. Cek keunikan nama kategori
    const existing = await prisma.category.findUnique({
      where: { name },
    });

    if (existing) {
      return {
        success: false,
        message: `Kategori "${name}" sudah terdaftar sebelumnya.`,
      };
    }

    // 4. Buat kategori baru di database
    const category = await prisma.category.create({
      data: { name },
    });

    // 5. Catat Audit Log
    await createAuditLog({
      userId: admin.id,
      action: "CATEGORY_CREATED",
      entity: "Category",
      entityId: category.id,
      details: `Menambahkan kategori baru: ${name}`,
    });

    revalidatePath("/admin/kategori");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Kategori "${name}" berhasil ditambahkan.`,
    };
  } catch (error: any) {
    console.error("[CREATE CATEGORY ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan internal saat menyimpan kategori.",
    };
  }
}

/**
 * Server Action: Ubah Kategori (Khusus ADMIN)
 */
export async function updateCategoryAction(
  id: string,
  _prevState: CategoryActionResult | null,
  formData: FormData
): Promise<CategoryActionResult> {
  try {
    const admin = await requireAdmin();

    const rawData = { name: formData.get("name") };
    const parsed = categorySchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        message: "Data kategori tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { name } = parsed.data;

    // Cek duplikasi dengan kategori lain
    const duplicate = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id },
      },
    });

    if (duplicate) {
      return {
        success: false,
        message: `Kategori "${name}" sudah digunakan oleh entri lain.`,
      };
    }

    await prisma.category.update({
      where: { id },
      data: { name },
    });

    await createAuditLog({
      userId: admin.id,
      action: "CATEGORY_UPDATED",
      entity: "Category",
      entityId: id,
      details: `Memperbarui nama kategori menjadi: ${name}`,
    });

    revalidatePath("/admin/kategori");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Kategori berhasil diperbarui menjadi "${name}".`,
    };
  } catch (error: any) {
    console.error("[UPDATE CATEGORY ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memperbarui kategori.",
    };
  }
}

/**
 * Server Action: Hapus Kategori (Khusus ADMIN)
 */
export async function deleteCategoryAction(id: string): Promise<CategoryActionResult> {
  try {
    const admin = await requireAdmin();

    // Pastikan tidak ada buku yang terkait sebelum dihapus (Data Integrity)
    const booksCount = await prisma.book.count({
      where: { categoryId: id },
    });

    if (booksCount > 0) {
      return {
        success: false,
        message: `Kategori tidak dapat dihapus karena masih menaungi ${booksCount} buku. Pindahkan atau hapus buku terkait terlebih dahulu.`,
      };
    }

    const deleted = await prisma.category.delete({
      where: { id },
    });

    await createAuditLog({
      userId: admin.id,
      action: "CATEGORY_DELETED",
      entity: "Category",
      entityId: id,
      details: `Menghapus kategori: ${deleted.name}`,
    });

    revalidatePath("/admin/kategori");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Kategori "${deleted.name}" berhasil dihapus.`,
    };
  } catch (error: any) {
    console.error("[DELETE CATEGORY ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat menghapus kategori.",
    };
  }
}
