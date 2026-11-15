import Link from "next/link";
import { redirect } from "next/navigation";
import Image from "next/image";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { LoanActionButtons } from "@/components/admin/LoanActionButtons";
import {
  CalendarCheck2,
  Clock,
  CheckCircle,
  AlertTriangle,
  XCircle,
  BookOpen,
  User,
  Coins,
} from "lucide-react";
import { LoanStatus } from "@prisma/client";

interface AdminLoansPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminLoansPage({ searchParams }: AdminLoansPageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const statusFilter = typeof resolvedSearchParams.status === "string" ? resolvedSearchParams.status : "ALL";

  const whereCondition: any = {};
  if (statusFilter !== "ALL" && Object.values(LoanStatus).includes(statusFilter as LoanStatus)) {
    whereCondition.status = statusFilter as LoanStatus;
  }

  // Hitung jumlah per status untuk badge filter tab
  const [counts, loans] = await Promise.all([
    prisma.loan.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.loan.findMany({
      where: whereCondition,
      orderBy: { createdAt: "desc" },
      include: {
        book: { select: { id: true, title: true, author: true, coverUrl: true, stock: true } },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const countMap: Record<string, number> = {};
  let totalCount = 0;
  counts.forEach((c) => {
    countMap[c.status] = c._count._all;
    totalCount += c._count._all;
  });

  const now = new Date();
  const finePerDay = process.env.FINE_PER_DAY ? parseInt(process.env.FINE_PER_DAY, 10) : 1000;

  const tabs = [
    { label: "Semua", value: "ALL", count: totalCount },
    { label: "Menunggu Persetujuan", value: LoanStatus.PENDING, count: countMap[LoanStatus.PENDING] || 0 },
    { label: "Sedang Dipinjam", value: LoanStatus.BORROWED, count: countMap[LoanStatus.BORROWED] || 0 },
    { label: "Sudah Kembali", value: LoanStatus.RETURNED, count: countMap[LoanStatus.RETURNED] || 0 },
    { label: "Ditolak / Batal", value: LoanStatus.REJECTED, count: (countMap[LoanStatus.REJECTED] || 0) + (countMap[LoanStatus.CANCELLED] || 0) },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/peminjaman" adminName={user.name} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
            <CalendarCheck2 className="w-5 h-5" />
            <h1>Sirkulasi Peminjaman Buku Warga</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Persetujuan pengajuan pinjaman, pencatatan tanggal kembali, dan perhitungan denda otomatis.
          </p>
        </div>

        {/* Tab Filter Status */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-stone-200/80 pb-3">
          {tabs.map((tab) => {
            const isActive = statusFilter === tab.value;
            return (
              <Link
                key={tab.value}
                href={`/admin/peminjaman${tab.value === "ALL" ? "" : `?status=${tab.value}`}`}
                className={`py-1.5 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isActive
                    ? "bg-emerald-700 text-white shadow-xs"
                    : "bg-white text-stone-600 hover:bg-stone-50 border border-stone-200"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-emerald-800 text-emerald-100" : "bg-stone-100 text-stone-500"
                  }`}
                >
                  {tab.count}
                </span>
              </Link>
            );
          })}
        </div>

        {/* Tabel Sirkulasi Peminjaman */}
        <div className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Buku</th>
                  <th className="py-3 px-4">Peminjam</th>
                  <th className="py-3 px-4">Tgl Pengajuan</th>
                  <th className="py-3 px-4">Jatuh Tempo</th>
                  <th className="py-3 px-4">Status & Denda</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {loans.length > 0 ? (
                  loans.map((loan) => {
                    const isLate =
                      loan.dueDate && now > loan.dueDate && loan.status === LoanStatus.BORROWED;
                    const daysLate =
                      isLate && loan.dueDate
                        ? Math.ceil((now.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24))
                        : 0;
                    const estimatedFine = daysLate * finePerDay;

                    return (
                      <tr key={loan.id} className="hover:bg-stone-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-8 h-11 rounded bg-stone-100 overflow-hidden flex-shrink-0 border border-stone-200">
                              {loan.book.coverUrl ? (
                                <Image
                                  src={loan.book.coverUrl}
                                  alt={loan.book.title}
                                  fill
                                  sizes="32px"
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-stone-400">
                                  <BookOpen className="w-3.5 h-3.5" />
                                </div>
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-stone-800 line-clamp-1">
                                {loan.book.title}
                              </div>
                              <div className="text-stone-400 text-[11px]">
                                {loan.book.author} • Sisa Stok: {loan.book.stock}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-stone-400" />
                            <span>{loan.user.name}</span>
                          </div>
                          <div className="text-stone-400 text-[11px]">{loan.user.email}</div>
                        </td>

                        <td className="py-3 px-4 text-stone-600">
                          {new Date(loan.requestDate).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>

                        <td className="py-3 px-4">
                          {loan.dueDate ? (
                            <div>
                              <span
                                className={`font-semibold ${
                                  isLate ? "text-red-700" : "text-stone-700"
                                }`}
                              >
                                {new Date(loan.dueDate).toLocaleDateString("id-ID", {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                })}
                              </span>
                              {isLate && (
                                <span className="block text-[10px] text-red-600 font-bold mt-0.5">
                                  Terlambat {daysLate} hari
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-stone-400">-</span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          {loan.status === LoanStatus.PENDING && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              <Clock className="w-3 h-3" />
                              <span>Menunggu Persetujuan</span>
                            </span>
                          )}

                          {loan.status === LoanStatus.BORROWED && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                              <CheckCircle className="w-3 h-3" />
                              <span>Sedang Dipinjam</span>
                            </span>
                          )}

                          {loan.status === LoanStatus.RETURNED && (
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                <CheckCircle className="w-3 h-3" />
                                <span>Dikembalikan</span>
                              </span>
                              {loan.fine > 0 && (
                                <span className="block text-[10px] text-red-600 font-bold mt-0.5 flex items-center gap-0.5">
                                  <Coins className="w-2.5 h-2.5" />
                                  <span>Denda: Rp{loan.fine.toLocaleString("id-ID")}</span>
                                </span>
                              )}
                            </div>
                          )}

                          {loan.status === LoanStatus.REJECTED && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                              <XCircle className="w-3 h-3" />
                              <span>Ditolak</span>
                            </span>
                          )}

                          {loan.status === LoanStatus.CANCELLED && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-full border border-stone-200">
                              <span>Dibatalkan Warga</span>
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <LoanActionButtons
                            loanId={loan.id}
                            status={loan.status}
                            bookTitle={loan.book.title}
                            userName={loan.user.name}
                            isLate={Boolean(isLate)}
                            estimatedFine={estimatedFine}
                          />
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-stone-400 text-xs">
                      Tidak ada catatan peminjaman dalam kategori status ini.
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
