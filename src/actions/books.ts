"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { bookSchema } from "@/schemas/book.schema";
import { saveCoverImage } from "@/lib/upload";
import { createAuditLog } from "@/lib/audit";
import { LoanStatus } from "@prisma/client";

export type BookActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
  bookId?: string;
};

/**
 * Server Action: Tambah Buku Baru (Khusus ADMIN)
 * Keamanan:
 * - Cek otentikasi & peran ganda (Defense-in-depth: requireAdmin)
 * - Validasi input ketat dengan Zod
 * - Validasi ukuran, MIME, ekstensi, dan Magic Bytes gambar sampul
 * - Sanitasi nama file sampul acak UUID (anti-RCE & Path Traversal)
 * - Pencatatan ke tabel AuditLog
 */
export async function createBookAction(
  _prevState: BookActionResult | null,
  formData: FormData
): Promise<BookActionResult> {
  try {
    const admin = await requireAdmin();

    // 1. Validasi teks formulir menggunakan Zod
    const rawData = {
      title: formData.get("title"),
      author: formData.get("author"),
      publisher: formData.get("publisher"),
      year: formData.get("year"),
      isbn: formData.get("isbn") || undefined,
      stock: formData.get("stock"),
      categoryId: formData.get("categoryId"),
      description: formData.get("description") || undefined,
      coverUrl: formData.get("coverUrl") || undefined,
    };

    const parsed = bookSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data buku tidak valid. Mohon periksa kembali kolom input.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const bookData = parsed.data;

    // 2. Validasi keunikan ISBN jika diisi
    if (bookData.isbn) {
      const existingIsbn = await prisma.book.findUnique({
        where: { isbn: bookData.isbn },
      });
      if (existingIsbn) {
        return {
          success: false,
          message: `ISBN "${bookData.isbn}" sudah terdaftar untuk buku lain.`,
        };
      }
    }

    // 3. Verifikasi keberadaan Kategori
    const categoryExists = await prisma.category.findUnique({
      where: { id: bookData.categoryId },
    });
    if (!categoryExists) {
      return {
        success: false,
        message: "Kategori yang dipilih tidak valid atau sudah dihapus.",
      };
    }

    // 4. Penanganan Upload File Sampul Gambar (Poin Keamanan 9)
    let finalCoverUrl = bookData.coverUrl || null;
    const coverFile = formData.get("coverFile") as File | null;

    if (coverFile && coverFile.size > 0 && coverFile.name !== "undefined") {
      const uploadResult = await saveCoverImage(coverFile);
      if (!uploadResult.success) {
        return {
          success: false,
          message: uploadResult.error || "Gagal mengunggah file gambar sampul.",
        };
      }
      finalCoverUrl = uploadResult.filePath!;
    }

    // 5. Simpan buku ke database (Parameterized Prisma Query)
    const newBook = await prisma.book.create({
      data: {
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        year: bookData.year,
        isbn: bookData.isbn || null,
        stock: bookData.stock,
        categoryId: bookData.categoryId,
        description: bookData.description || null,
        coverUrl: finalCoverUrl,
      },
    });

    // 6. Pencatatan Audit Trail
    await createAuditLog({
      userId: admin.id,
      action: "BOOK_CREATED",
      entity: "Book",
      entityId: newBook.id,
      details: `Menambahkan buku baru: "${newBook.title}" (Stok: ${newBook.stock}, ISBN: ${newBook.isbn || "-"})`,
    });

    revalidatePath("/admin/buku");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Buku "${newBook.title}" berhasil ditambahkan.`,
      bookId: newBook.id,
    };
  } catch (error: any) {
    console.error("[CREATE BOOK ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan internal saat menyimpan buku.",
    };
  }
}

/**
 * Server Action: Update Data Buku (Khusus ADMIN)
 */
export async function updateBookAction(
  id: string,
  _prevState: BookActionResult | null,
  formData: FormData
): Promise<BookActionResult> {
  try {
    const admin = await requireAdmin();

    const rawData = {
      title: formData.get("title"),
      author: formData.get("author"),
      publisher: formData.get("publisher"),
      year: formData.get("year"),
      isbn: formData.get("isbn") || undefined,
      stock: formData.get("stock"),
      categoryId: formData.get("categoryId"),
      description: formData.get("description") || undefined,
      coverUrl: formData.get("coverUrl") || undefined,
    };

    const parsed = bookSchema.safeParse(rawData);
    if (!parsed.success) {
      return {
        success: false,
        message: "Data perubahan buku tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const bookData = parsed.data;

    // Pastikan buku ada
    const currentBook = await prisma.book.findUnique({
      where: { id },
    });
    if (!currentBook) {
      return {
        success: false,
        message: "Buku tidak ditemukan.",
      };
    }

    // Cek duplikasi ISBN dengan buku lain
    if (bookData.isbn) {
      const duplicateIsbn = await prisma.book.findFirst({
        where: {
          isbn: bookData.isbn,
          NOT: { id },
        },
      });
      if (duplicateIsbn) {
        return {
          success: false,
          message: `ISBN "${bookData.isbn}" sudah digunakan oleh buku lain.`,
        };
      }
    }

    // Penanganan upload sampul baru jika ada
    let finalCoverUrl = currentBook.coverUrl;
    const coverFile = formData.get("coverFile") as File | null;

    if (coverFile && coverFile.size > 0 && coverFile.name !== "undefined") {
      const uploadResult = await saveCoverImage(coverFile);
      if (!uploadResult.success) {
        return {
          success: false,
          message: uploadResult.error || "Gagal mengunggah gambar sampul baru.",
        };
      }
      finalCoverUrl = uploadResult.filePath!;
    } else if (bookData.coverUrl !== undefined && bookData.coverUrl !== "") {
      finalCoverUrl = bookData.coverUrl;
    }

    // Update buku
    const updated = await prisma.book.update({
      where: { id },
      data: {
        title: bookData.title,
        author: bookData.author,
        publisher: bookData.publisher,
        year: bookData.year,
        isbn: bookData.isbn || null,
        stock: bookData.stock,
        categoryId: bookData.categoryId,
        description: bookData.description || null,
        coverUrl: finalCoverUrl,
      },
    });

    // Catat log audit perubahan
    await createAuditLog({
      userId: admin.id,
      action: "BOOK_UPDATED",
      entity: "Book",
      entityId: id,
      details: `Memperbarui buku "${updated.title}". Perubahan stok: ${currentBook.stock} -> ${updated.stock}`,
    });

    revalidatePath("/admin/buku");
    revalidatePath(`/admin/buku/${id}/edit`);
    revalidatePath("/katalog");
    revalidatePath(`/katalog/${id}`);

    return {
      success: true,
      message: `Buku "${updated.title}" berhasil diperbarui.`,
    };
  } catch (error: any) {
    console.error("[UPDATE BOOK ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan internal saat memperbarui buku.",
    };
  }
}

/**
 * Server Action: Hapus Buku (Khusus ADMIN)
 * Integritas Data: Menolak penghapusan jika buku memiliki pinjaman berstatus BORROWED atau PENDING
 */
export async function deleteBookAction(id: string): Promise<BookActionResult> {
  try {
    const admin = await requireAdmin();

    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        loans: {
          where: {
            status: { in: [LoanStatus.BORROWED, LoanStatus.PENDING] },
          },
        },
      },
    });

    if (!book) {
      return {
        success: false,
        message: "Buku tidak ditemukan.",
      };
    }

    if (book.loans.length > 0) {
      return {
        success: false,
        message: `Buku "${book.title}" tidak dapat dihapus karena masih ada ${book.loans.length} peminjaman aktif/pending.`,
      };
    }

    await prisma.book.delete({
      where: { id },
    });

    await createAuditLog({
      userId: admin.id,
      action: "BOOK_DELETED",
      entity: "Book",
      entityId: id,
      details: `Menghapus buku "${book.title}" (ISBN: ${book.isbn || "-"})`,
    });

    revalidatePath("/admin/buku");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Buku "${book.title}" berhasil dihapus dari sistem.`,
    };
  } catch (error: any) {
    console.error("[DELETE BOOK ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan internal saat menghapus buku.",
    };
  }
}
