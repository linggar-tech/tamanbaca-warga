import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MemberNav } from "@/components/layout/MemberNav";
import { CancelLoanButton } from "@/components/member/CancelLoanButton";
import {
  BookOpen,
  Clock,
  CheckCircle,
  AlertTriangle,
  Library,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { LoanStatus } from "@prisma/client";

export default async function MemberDashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Anti-IDOR: Query STRICT hanya untuk userId dari sesi aktif
  const [activeLoans, loanHistoryCount] = await Promise.all([
    prisma.loan.findMany({
      where: {
        userId: user.id, // Filter Anti-IDOR
        status: { in: [LoanStatus.PENDING, LoanStatus.BORROWED] },
      },
      include: {
        book: {
          include: { category: true },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.loan.count({
      where: { userId: user.id }, // Filter Anti-IDOR
    }),
  ]);

  const activeCount = activeLoans.length;
  const remainingQuota = Math.max(0, 3 - activeCount);
  const now = new Date();

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <MemberNav currentPath="/member/dashboard" userName={user.name} />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Banner Selamat Datang */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-600/40">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Akun Warga Terverifikasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Halo, {user.name}!
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Pantau batas waktu pinjaman buku Anda dan temukan ribuan bahan bacaan menarik di katalog warga.
            </p>
          </div>

          <Link
            href="/katalog"
            className="py-2.5 px-5 bg-white text-emerald-900 font-semibold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors flex items-center gap-2 self-start sm:self-auto"
          >
            <Library className="w-4 h-4" />
            <span>Cari Buku Baru</span>
          </Link>
        </div>

        {/* Ringkasan Kuota Peminjaman */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">Pinjaman Aktif Saat Ini</span>
            <div className="text-2xl font-extrabold text-stone-800 mt-2">
              {activeCount} <span className="text-xs font-normal text-stone-400">/ 3 buku</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Buku yang sedang dipinjam atau menunggu persetujuan.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">Sisa Kuota Peminjaman</span>
            <div className="text-2xl font-extrabold text-emerald-700 mt-2">
              {remainingQuota} <span className="text-xs font-normal text-stone-400">buku lagi</span>
            </div>
            <p className="text-[11px] text-stone-500 mt-1">Setiap warga berhak meminjam hingga 3 buku secara bersamaan.</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <span className="text-xs font-semibold text-stone-500">Total Riwayat Pinjaman</span>
            <div className="text-2xl font-extrabold text-stone-800 mt-2">
              {loanHistoryCount} <span className="text-xs font-normal text-stone-400">transaksi</span>
            </div>
            <Link
              href="/member/pinjaman"
              className="text-[11px] font-semibold text-emerald-700 hover:underline mt-1 inline-flex items-center gap-1"
            >
              <span>Lihat semua riwayat</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Daftar Pinjaman Aktif */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-6">
            <div>
              <h2 className="text-base font-bold text-stone-800">Pinjaman Aktif & Pengajuan Berjalan</h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Pastikan Anda mengembalikan buku sebelum tanggal jatuh tempo untuk menghindari denda.
              </p>
            </div>
            <span className="text-xs font-semibold text-emerald-700">
              {activeCount} buku
            </span>
          </div>

          {activeLoans.length > 0 ? (
            <div className="space-y-4">
              {activeLoans.map((loan) => {
                const isLate = loan.dueDate && now > loan.dueDate && loan.status === LoanStatus.BORROWED;
                const daysLate = isLate && loan.dueDate
                  ? Math.ceil((now.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                  : 0;

                return (
                  <div
                    key={loan.id}
                    className="p-4 rounded-2xl border border-stone-200/80 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-stone-200 flex-shrink-0 border border-stone-200">
                        {loan.book.coverUrl ? (
                          <Image
                            src={loan.book.coverUrl}
                            alt={loan.book.title}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-stone-400">
                            <BookOpen className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 mb-1">
                          {loan.book.category.name}
                        </span>
                        <h3 className="text-sm font-bold text-stone-800 line-clamp-1">
                          {loan.book.title}
                        </h3>
                        <p className="text-xs text-stone-500 mt-0.5">
                          Karya {loan.book.author}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                          {loan.status === LoanStatus.PENDING && (
                            <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full font-medium border border-amber-200">
                              <Clock className="w-3.5 h-3.5" />
                              <span>Menunggu Persetujuan Admin</span>
                            </span>
                          )}

                          {loan.status === LoanStatus.BORROWED && (
                            <span className="inline-flex items-center gap-1 text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Sedang Dipinjam</span>
                            </span>
                          )}

                          {loan.dueDate && (
                            <span className={`text-[11px] font-medium ${isLate ? "text-red-700 font-bold" : "text-stone-600"}`}>
                              Jatuh Tempo:{" "}
                              {new Date(loan.dueDate).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-200">
                      {isLate && (
                        <div className="inline-flex items-center gap-1 text-xs text-red-700 font-bold bg-red-100/80 px-2.5 py-1 rounded-lg">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Terlambat {daysLate} hari</span>
                        </div>
                      )}

                      {loan.status === LoanStatus.PENDING && (
                        <CancelLoanButton loanId={loan.id} bookTitle={loan.book.title} />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-stone-800">Tidak Ada Pinjaman Aktif</h3>
              <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
                Anda sedang tidak memiliki pinjaman berjalan. Ingin membaca buku baru hari ini?
              </p>
              <div className="mt-4">
                <Link
                  href="/katalog"
                  className="inline-flex items-center gap-1.5 py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
                >
                  <Library className="w-3.5 h-3.5" />
                  <span>Jelajahi Katalog Perpustakaan</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
