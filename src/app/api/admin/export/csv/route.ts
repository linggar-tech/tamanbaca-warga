import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateSafeCsv } from "@/lib/export-csv";
import { createAuditLog } from "@/lib/audit";
import { Role, LoanStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // 1. Verifikasi Hak Akses Khusus ADMIN (Defense-in-depth)
    const user = await getCurrentUser();
    if (!user || user.role !== Role.ADMIN) {
      return new NextResponse(
        JSON.stringify({ error: "Akses Ditolak: Hanya administrator yang berhak mengekspor data." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    // 2. Rate Limiting Ekspor: Maksimal 10 ekspor per menit (Poin Keamanan 7)
    const rateLimit = checkRateLimit(`export_csv_${user.id}`, {
      limit: 10,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({ error: "Batas ekspor tercapai. Harap tunggu 1 menit sebelum mengunduh kembali." }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    }

    // 3. Ekstraksi dan Validasi Parameter Filter
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");
    const statusParam = searchParams.get("status");

    const whereCondition: any = {};

    if (startDateParam || endDateParam) {
      whereCondition.requestDate = {};
      if (startDateParam) {
        whereCondition.requestDate.gte = new Date(startDateParam);
      }
      if (endDateParam) {
        const end = new Date(endDateParam);
        end.setHours(23, 59, 59, 999);
        whereCondition.requestDate.lte = end;
      }
    }

    if (statusParam && Object.values(LoanStatus).includes(statusParam as LoanStatus)) {
      whereCondition.status = statusParam as LoanStatus;
    }

    // 4. Query Data Peminjaman
    const loans = await prisma.loan.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        book: { select: { title: true, isbn: true, author: true } },
        user: { select: { name: true, email: true } },
      },
    });

    // 5. Susun Baris CSV dengan Sanitasi Anti-CSV Injection
    const headers = [
      "ID Pinjaman",
      "Judul Buku",
      "Pengarang",
      "ISBN",
      "Nama Peminjam",
      "Email Peminjam",
      "Tanggal Pengajuan",
      "Tanggal Pinjam",
      "Jatuh Tempo",
      "Tanggal Kembali",
      "Status",
      "Denda (Rupiah)",
    ];

    const rows = loans.map((loan) => [
      loan.id,
      loan.book.title,
      loan.book.author,
      loan.book.isbn || "-",
      loan.user.name,
      loan.user.email,
      loan.requestDate ? new Date(loan.requestDate).toISOString().split("T")[0] : "-",
      loan.loanDate ? new Date(loan.loanDate).toISOString().split("T")[0] : "-",
      loan.dueDate ? new Date(loan.dueDate).toISOString().split("T")[0] : "-",
      loan.returnDate ? new Date(loan.returnDate).toISOString().split("T")[0] : "-",
      loan.status,
      loan.fine,
    ]);

    const csvContent = generateSafeCsv(headers, rows);

    // 6. Catat ke AuditLog
    await createAuditLog({
      userId: user.id,
      action: "EXPORT_CSV_LOANS",
      entity: "Report",
      details: `Ekspor data peminjaman ke CSV (${loans.length} baris data)`,
    });

    const filename = `rekap-peminjaman-${new Date().toISOString().split("T")[0]}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[EXPORT CSV ERROR]", error);
    return new NextResponse(
      JSON.stringify({ error: "Terjadi kesalahan internal saat mengekspor data." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
