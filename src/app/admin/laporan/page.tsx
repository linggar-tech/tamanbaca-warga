import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import {
  FileBarChart2,
  Download,
  Filter,
  FileSpreadsheet,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  XCircle,
  Coins,
} from "lucide-react";
import { LoanStatus } from "@prisma/client";

interface AdminReportsPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminReportsPage({ searchParams }: AdminReportsPageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const startDate = typeof resolvedSearchParams.startDate === "string" ? resolvedSearchParams.startDate : "";
  const endDate = typeof resolvedSearchParams.endDate === "string" ? resolvedSearchParams.endDate : "";
  const status = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "ALL";

  // Bangun filter query
  const whereCondition: any = {};

  if (startDate || endDate) {
    whereCondition.requestDate = {};
    if (startDate) {
      whereCondition.requestDate.gte = new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      whereCondition.requestDate.lte = end;
    }
  }

  if (status !== "ALL" && Object.values(LoanStatus).includes(status as LoanStatus)) {
    whereCondition.status = status as LoanStatus;
  }

  // Ambil data laporan
  const loans = await prisma.loan.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    include: {
      book: { select: { title: true, author: true, isbn: true } },
      user: { select: { name: true, email: true } },
    },
  });

  // Hitung ringkasan
  let totalReturned = 0;
  let totalFine = 0;
  loans.forEach((l) => {
    if (l.status === LoanStatus.RETURNED) totalReturned += 1;
    totalFine += l.fine;
  });

  // Query string untuk ekspor
  const exportQueryParams = new URLSearchParams();
  if (startDate) exportQueryParams.set("startDate", startDate);
  if (endDate) exportQueryParams.set("endDate", endDate);
  if (status !== "ALL") exportQueryParams.set("status", status);
  const exportQueryString = exportQueryParams.toString() ? `?${exportQueryParams.toString()}` : "";

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/laporan" adminName={user.name} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Header Laporan */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
              <FileBarChart2 className="w-5 h-5" />
              <h1>Rekap Laporan Peminjaman</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Rekapitulasi sirkulasi peminjaman buku warga, status pengembalian, dan riwayat denda.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            {/* Tombol Ekspor CSV dengan sanitasi Anti-CSV Injection */}
            <a
              href={`/api/admin/export/csv${exportQueryString}`}
              className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Unduh Rekap Laporan Format CSV (Aman dari CSV Injection)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </a>

            {/* Tombol Ekspor PDF */}
            <a
              href={`/api/admin/export/pdf${exportQueryString}`}
              className="py-2 px-3.5 bg-white hover:bg-stone-50 text-stone-700 border border-stone-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
              title="Cetak Rekap Laporan Format PDF Resmi"
            >
              <FileText className="w-4 h-4 text-emerald-700" />
              <span>Cetak PDF</span>
            </a>
          </div>
        </div>

        {/* Bar Filter Laporan */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs mb-8">
          <form method="GET" action="/admin/laporan" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={startDate}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                name="endDate"
                defaultValue={endDate}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-600 mb-1">
                Status Peminjaman
              </label>
              <select
                name="status"
                defaultValue={status}
                className="w-full px-3 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="ALL">Semua Status</option>
                <option value={LoanStatus.PENDING}>Menunggu Persetujuan</option>
                <option value={LoanStatus.BORROWED}>Sedang Dipinjam</option>
                <option value={LoanStatus.RETURNED}>Sudah Dikembalikan</option>
                <option value={LoanStatus.REJECTED}>Ditolak</option>
                <option value={LoanStatus.CANCELLED}>Dibatalkan</option>
              </select>
            </div>

            <div className="flex items-end gap-2">
              <button
                type="submit"
                className="flex-1 py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Terapkan Filter</span>
              </button>

              {(startDate || endDate || status !== "ALL") && (
                <Link
                  href="/admin/laporan"
                  className="py-2 px-3 text-stone-500 hover:text-stone-700 text-xs flex items-center"
                >
                  Reset
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* Kartu Ringkasan Hasil Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">Total Transaksi Sesuai Filter</span>
            <div className="text-2xl font-extrabold text-stone-800 mt-2">
              {loans.length} <span className="text-xs font-normal text-stone-400">transaksi</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Data yang siap diekspor ke CSV/PDF.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">Selesai Dikembalikan</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2">
              {totalReturned} <span className="text-xs font-normal text-stone-400">buku</span>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Buku yang telah kembali ke rak perpustakaan.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">Total Denda Terkumpul</span>
            <div className="text-2xl font-extrabold text-amber-700 mt-2">
              Rp{totalFine.toLocaleString("id-ID")}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Dari keterlambatan pengembalian buku.</p>
          </div>
        </div>

        {/* Tabel Data Laporan */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-stone-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-800">
              Data Sirkulasi Terpilih ({loans.length})
            </h3>
            <span className="text-[11px] text-stone-400">
              Rate limiting ekspor: maks 10 unduhan/menit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Judul Buku</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Tgl Pengajuan</th>
                  <th className="py-3 px-4">Tgl Pinjam</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4">Tgl Kembali</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Denda</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loans.length > 0 ? (
                  loans.map((loan) => (
                    <tr key={loan.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-800 line-clamp-1">{loan.book.title}</div>
                        <div className="text-[11px] text-stone-400">{loan.book.author}</div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-800">{loan.user.name}</div>
                        <div className="text-[11px] text-stone-400">{loan.user.email}</div>
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        {new Date(loan.requestDate).toLocaleDateString("id-ID")}
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        {loan.loanDate ? new Date(loan.loanDate).toLocaleDateString("id-ID") : "-"}
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        {loan.dueDate ? new Date(loan.dueDate).toLocaleDateString("id-ID") : "-"}
                      </td>

                      <td className="py-3 px-4 text-stone-600">
                        {loan.returnDate ? new Date(loan.returnDate).toLocaleDateString("id-ID") : "-"}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            loan.status === LoanStatus.BORROWED
                              ? "bg-blue-50 text-blue-800"
                              : loan.status === LoanStatus.RETURNED
                              ? "bg-emerald-50 text-emerald-800"
                              : loan.status === LoanStatus.PENDING
                              ? "bg-amber-50 text-amber-800"
                              : "bg-stone-100 text-stone-600"
                          }`}
                        >
                          {loan.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold">
                        {loan.fine > 0 ? (
                          <span className="text-red-600">
                            Rp{loan.fine.toLocaleString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-stone-400">Rp0</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-stone-400 text-xs">
                      Tidak ada catatan transaksi peminjaman pada filter periode ini.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
