"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { requestLoanSchema, loanActionSchema } from "@/schemas/loan.schema";
import { createAuditLog } from "@/lib/audit";
import { LoanStatus } from "@prisma/client";

export type LoanActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// Durasi batas waktu pinjam (dalam hari)
const LOAN_DURATION_DAYS = 7;
// Batas maksimal pinjaman aktif per anggota (Poin Keamanan & Bisnis)
const MAX_ACTIVE_LOANS = 3;

// Besaran denda per hari (diambil dari env, default 1000)
function getFinePerDay(): number {
  const envFine = process.env.FINE_PER_DAY;
  const parsed = envFine ? parseInt(envFine, 10) : 1000;
  return isNaN(parsed) ? 1000 : parsed;
}

/**
 * Server Action: Ajukan Peminjaman Buku (MEMBER)
 * Keamanan:
 * - Autentikasi ketat via requireAuth()
 * - Membatasi maksimal 3 pinjaman aktif (PENDING / BORROWED)
 * - Mencegah pengajuan ganda untuk buku yang sama yang belum selesai
 * - Memeriksa ketersediaan stok buku
 */
export async function requestLoanAction(
  _prevState: LoanActionResult | null,
  formData: FormData
): Promise<LoanActionResult> {
  try {
    const user = await requireAuth();

    // 1. Validasi input ID Buku
    const parsed = requestLoanSchema.safeParse({
      bookId: formData.get("bookId"),
    });

    if (!parsed.success) {
      return {
        success: false,
        message: "ID buku tidak valid.",
        errors: parsed.error.flatten().fieldErrors,
      };
    }

    const { bookId } = parsed.data;

    // 2. Periksa apakah buku ada di database dan stok tersedia
    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return {
        success: false,
        message: "Buku yang ingin dipinjam tidak ditemukan.",
      };
    }

    if (book.stock <= 0) {
      return {
        success: false,
        message: `Maaf, stok untuk buku "${book.title}" sedang habis.`,
      };
    }

    // 3. Periksa kuota pinjaman aktif pengguna (Maksimal 3)
    const activeLoansCount = await prisma.loan.count({
      where: {
        userId: user.id,
        status: { in: [LoanStatus.PENDING, LoanStatus.BORROWED] },
      },
    });

    if (activeLoansCount >= MAX_ACTIVE_LOANS) {
      return {
        success: false,
        message: `Anda telah mencapai batas maksimal ${MAX_ACTIVE_LOANS} peminjaman aktif. Selesaikan peminjaman sebelumnya terlebih dahulu.`,
      };
    }

    // 4. Periksa apakah pengguna sedang meminjam buku yang sama
    const duplicateLoan = await prisma.loan.findFirst({
      where: {
        userId: user.id,
        bookId: book.id,
        status: { in: [LoanStatus.PENDING, LoanStatus.BORROWED] },
      },
    });

    if (duplicateLoan) {
      return {
        success: false,
        message: `Anda sudah memiliki pengajuan atau peminjaman aktif untuk buku "${book.title}".`,
      };
    }

    // 5. Buat entri pengajuan peminjaman
    const newLoan = await prisma.loan.create({
      data: {
        userId: user.id,
        bookId: book.id,
        status: LoanStatus.PENDING,
        requestDate: new Date(),
      },
    });

    // 6. Catat Audit Trail
    await createAuditLog({
      userId: user.id,
      action: "LOAN_REQUESTED",
      entity: "Loan",
      entityId: newLoan.id,
      details: `Pengajuan pinjaman buku: "${book.title}" oleh ${user.name} (${user.email})`,
    });

    revalidatePath("/member/dashboard");
    revalidatePath("/member/pinjaman");
    revalidatePath("/admin/peminjaman");

    return {
      success: true,
      message: `Pengajuan peminjaman buku "${book.title}" berhasil dikirim. Menunggu persetujuan pengelola.`,
    };
  } catch (error: any) {
    console.error("[REQUEST LOAN ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan internal saat mengajukan peminjaman.",
    };
  }
}

/**
 * Server Action: Batalkan Pengajuan Pinjaman (MEMBER)
 * Keamanan Anti-IDOR (Insecure Direct Object Reference):
 * - Wajib menyaring berdasarkan { id: loanId, userId: currentUser.id }
 * - Pengguna HANYA dapat membatalkan pinjaman miliknya sendiri
 * - Hanya pinjaman berstatus PENDING yang dapat dibatalkan
 */
export async function cancelLoanAction(loanId: string): Promise<LoanActionResult> {
  try {
    const user = await requireAuth();

    // Verifikasi kepemilikan data (Anti-IDOR)
    const loan = await prisma.loan.findFirst({
      where: {
        id: loanId,
        userId: user.id, // Filter ketat berdasarkan userId sesi
      },
      include: { book: true },
    });

    if (!loan) {
      return {
        success: false,
        message: "Data peminjaman tidak ditemukan atau Anda tidak memiliki akses ke data ini.",
      };
    }

    if (loan.status !== LoanStatus.PENDING) {
      return {
        success: false,
        message: "Hanya pengajuan dengan status MENUNGGU (PENDING) yang dapat dibatalkan secara mandiri.",
      };
    }

    await prisma.loan.update({
      where: { id: loan.id },
      data: { status: LoanStatus.CANCELLED },
    });

    await createAuditLog({
      userId: user.id,
      action: "LOAN_CANCELLED",
      entity: "Loan",
      entityId: loan.id,
      details: `Warga membatalkan pengajuan pinjaman buku: "${loan.book.title}"`,
    });

    revalidatePath("/member/dashboard");
    revalidatePath("/member/pinjaman");
    revalidatePath("/admin/peminjaman");

    return {
      success: true,
      message: `Pengajuan peminjaman buku "${loan.book.title}" berhasil dibatalkan.`,
    };
  } catch (error: any) {
    console.error("[CANCEL LOAN ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat membatalkan peminjaman.",
    };
  }
}

/**
 * Server Action: Setujui Peminjaman (ADMIN)
 * Keamanan:
 * - Cek hak akses requireAdmin()
 * - Transaksi Database ACID (prisma.$transaction):
 *   1. Memastikan stok buku > 0
 *   2. Memastikan status loan masih PENDING
 *   3. Mengurangi stok buku secara atomik (mencegah stok minus / race condition)
 *   4. Menetapkan loanDate (sekarang) & dueDate (sekarang + 7 hari)
 */
export async function approveLoanAction(loanId: string): Promise<LoanActionResult> {
  try {
    const admin = await requireAdmin();

    const parsed = loanActionSchema.safeParse({ loanId });
    if (!parsed.success) {
      return { success: false, message: "ID peminjaman tidak valid." };
    }

    // Eksekusi transaksi database atomik
    const result = await prisma.$transaction(async (tx) => {
      // 1. Ambil data pinjaman
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { book: true, user: true },
      });

      if (!loan) {
        throw new Error("Data peminjaman tidak ditemukan.");
      }

      if (loan.status !== LoanStatus.PENDING) {
        throw new Error(`Peminjaman tidak dapat disetujui karena berstatus ${loan.status}.`);
      }

      // 2. Periksa ketersediaan stok fisik buku
      if (loan.book.stock <= 0) {
        throw new Error(`Stok buku "${loan.book.title}" tidak mencukupi untuk disetujui.`);
      }

      // 3. Kurangi stok buku secara atomik
      const updatedBook = await tx.book.update({
        where: { id: loan.bookId },
        data: { stock: { decrement: 1 } },
      });

      if (updatedBook.stock < 0) {
        throw new Error("Terjadi kesalahan integritas: Stok buku tidak boleh kurang dari 0.");
      }

      // 4. Hitung tanggal pinjam & jatuh tempo (7 hari dari sekarang)
      const now = new Date();
      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS);

      // 5. Update status pinjaman menjadi BORROWED
      const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: LoanStatus.BORROWED,
          loanDate: now,
          dueDate: dueDate,
        },
      });

      return { loan: updatedLoan, bookTitle: loan.book.title, userName: loan.user.name };
    });

    // Catat AuditLog
    await createAuditLog({
      userId: admin.id,
      action: "LOAN_APPROVED",
      entity: "Loan",
      entityId: loanId,
      details: `Admin menyetujui peminjaman "${result.bookTitle}" untuk ${result.userName}. Stok berkurang 1.`,
    });

    revalidatePath("/admin/peminjaman");
    revalidatePath("/admin/buku");
    revalidatePath("/admin/dashboard");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Peminjaman buku "${result.bookTitle}" untuk ${result.userName} berhasil disetujui.`,
    };
  } catch (error: any) {
    console.error("[APPROVE LOAN ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat menyetujui peminjaman.",
    };
  }
}

/**
 * Server Action: Tolak Peminjaman (ADMIN)
 */
export async function rejectLoanAction(
  loanId: string,
  reason?: string
): Promise<LoanActionResult> {
  try {
    const admin = await requireAdmin();

    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: { book: true, user: true },
    });

    if (!loan) {
      return { success: false, message: "Data peminjaman tidak ditemukan." };
    }

    if (loan.status !== LoanStatus.PENDING) {
      return {
        success: false,
        message: `Hanya pengajuan berstatus PENDING yang dapat ditolak. Saat ini berstatus ${loan.status}.`,
      };
    }

    await prisma.loan.update({
      where: { id: loanId },
      data: { status: LoanStatus.REJECTED },
    });

    await createAuditLog({
      userId: admin.id,
      action: "LOAN_REJECTED",
      entity: "Loan",
      entityId: loanId,
      details: `Admin menolak peminjaman "${loan.book.title}" oleh ${loan.user.name}. ${reason ? `Alasan: ${reason}` : ""}`,
    });

    revalidatePath("/admin/peminjaman");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      message: `Pengajuan peminjaman buku "${loan.book.title}" ditolak.`,
    };
  } catch (error: any) {
    console.error("[REJECT LOAN ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat menolak peminjaman.",
    };
  }
}

/**
 * Server Action: Catat Pengembalian Buku & Hitung Denda Otomatis (ADMIN)
 * Keamanan:
 * - Cek hak akses requireAdmin()
 * - Transaksi Database ACID (prisma.$transaction):
 *   1. Memastikan status loan adalah BORROWED
 *   2. Menambah stok buku secara atomik (+1)
 *   3. Menghitung keterlambatan (hari) dan denda otomatis (FINE_PER_DAY)
 *   4. Menetapkan status RETURNED, returnDate = now, fine = denda
 */
export async function returnLoanAction(loanId: string): Promise<LoanActionResult> {
  try {
    const admin = await requireAdmin();

    const finePerDay = getFinePerDay();

    const result = await prisma.$transaction(async (tx) => {
      const loan = await tx.loan.findUnique({
        where: { id: loanId },
        include: { book: true, user: true },
      });

      if (!loan) {
        throw new Error("Data peminjaman tidak ditemukan.");
      }

      if (loan.status !== LoanStatus.BORROWED) {
        throw new Error(`Buku tidak dapat dikembalikan karena status peminjaman adalah ${loan.status}.`);
      }

      const returnDate = new Date();
      let calculatedFine = 0;
      let daysLate = 0;

      // Hitung keterlambatan jika tanggal pengembalian melewati dueDate
      if (loan.dueDate && returnDate > loan.dueDate) {
        const diffMs = returnDate.getTime() - loan.dueDate.getTime();
        daysLate = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        if (daysLate > 0) {
          calculatedFine = daysLate * finePerDay;
        }
      }

      // 1. Tambah kembali stok buku secara atomik
      await tx.book.update({
        where: { id: loan.bookId },
        data: { stock: { increment: 1 } },
      });

      // 2. Perbarui data pinjaman
      const updatedLoan = await tx.loan.update({
        where: { id: loan.id },
        data: {
          status: LoanStatus.RETURNED,
          returnDate: returnDate,
          fine: calculatedFine,
        },
      });

      return {
        loan: updatedLoan,
        bookTitle: loan.book.title,
        userName: loan.user.name,
        daysLate,
        calculatedFine,
      };
    });

    // Catat AuditLog
    const fineMsg =
      result.calculatedFine > 0
        ? `Terlambat ${result.daysLate} hari (Denda: Rp${result.calculatedFine.toLocaleString("id-ID")})`
        : "Tepat waktu (Tanpa denda)";

    await createAuditLog({
      userId: admin.id,
      action: "LOAN_RETURNED",
      entity: "Loan",
      entityId: loanId,
      details: `Pengembalian buku "${result.bookTitle}" oleh ${result.userName} berhasil dicatat. Status: ${fineMsg}. Stok bertambah 1.`,
    });

    revalidatePath("/admin/peminjaman");
    revalidatePath("/admin/buku");
    revalidatePath("/admin/dashboard");
    revalidatePath("/katalog");

    return {
      success: true,
      message: `Buku "${result.bookTitle}" berhasil dikembalikan. ${fineMsg}.`,
    };
  } catch (error: any) {
    console.error("[RETURN LOAN ERROR]", error);
    return {
      success: false,
      message: error?.message || "Terjadi kesalahan saat memproses pengembalian buku.",
    };
  }
}
