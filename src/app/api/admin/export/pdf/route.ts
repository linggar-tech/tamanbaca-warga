import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { generateLoansPdf, LoanExportData } from "@/lib/export-pdf";
import { createAuditLog } from "@/lib/audit";
import { Role, LoanStatus } from "@prisma/client";

export async function GET(request: Request) {
  try {
    // 1. Verifikasi Akses Khusus ADMIN
    const user = await getCurrentUser();
    if (!user || user.role !== Role.ADMIN) {
      return new NextResponse(
        JSON.stringify({ error: "Akses Ditolak: Hanya administrator yang berhak mengekspor data." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    // 2. Rate Limiting Ekspor: Maksimal 10 ekspor per menit
    const rateLimit = checkRateLimit(`export_pdf_${user.id}`, {
      limit: 10,
      windowMs: 60 * 1000,
    });

    if (!rateLimit.success) {
      return new NextResponse(
        JSON.stringify({ error: "Batas unduhan PDF tercapai. Harap tunggu 1 menit." }),
        { status: 429, headers: { "content-type": "application/json" } }
      );
    }

    // 3. Ekstraksi Filter
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
        book: { select: { title: true } },
        user: { select: { name: true, email: true } },
      },
    });

    // 5. Susun Data untuk PDF
    let totalReturned = 0;
    let totalFine = 0;

    const formattedData: LoanExportData[] = loans.map((loan) => {
      if (loan.status === LoanStatus.RETURNED) totalReturned += 1;
      totalFine += loan.fine;

      return {
        id: loan.id,
        bookTitle: loan.book.title,
        userName: loan.user.name,
        userEmail: loan.user.email,
        requestDate: new Date(loan.requestDate).toLocaleDateString("id-ID"),
        loanDate: loan.loanDate ? new Date(loan.loanDate).toLocaleDateString("id-ID") : "-",
        dueDate: loan.dueDate ? new Date(loan.dueDate).toLocaleDateString("id-ID") : "-",
        returnDate: loan.returnDate ? new Date(loan.returnDate).toLocaleDateString("id-ID") : "-",
        status: loan.status,
        fine: loan.fine,
      };
    });

    let periodText = "Semua Waktu";
    if (startDateParam && endDateParam) {
      periodText = `${startDateParam} s/d ${endDateParam}`;
    } else if (startDateParam) {
      periodText = `Mulai ${startDateParam}`;
    } else if (endDateParam) {
      periodText = `Hingga ${endDateParam}`;
    }

    const pdfBuffer = generateLoansPdf(formattedData, {
      periodText,
      adminName: user.name,
      totalLoans: loans.length,
      totalReturned,
      totalFine,
    });

    // 6. Catat Audit Log
    await createAuditLog({
      userId: user.id,
      action: "EXPORT_PDF_LOANS",
      entity: "Report",
      details: `Ekspor data peminjaman ke PDF (${loans.length} entri)`,
    });

    const filename = `laporan-peminjaman-${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("[EXPORT PDF ERROR]", error);
    return new NextResponse(
      JSON.stringify({ error: "Terjadi kesalahan internal saat mencetak PDF." }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
