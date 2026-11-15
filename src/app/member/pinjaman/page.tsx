import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MemberNav } from "@/components/layout/MemberNav";
import { CancelLoanButton } from "@/components/member/CancelLoanButton";
import {
  BookOpen,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Coins,
} from "lucide-react";
import { LoanStatus } from "@prisma/client";

export default async function MemberLoansPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Anti-IDOR Protection: Query data strictly bound to authenticated user's ID
  const loans = await prisma.loan.findMany({
    where: {
      userId: user.id, // KUNCI KEAMANAN IDOR: Tidak pernah mengambil userId dari parameter request
    },
    include: {
      book: {
        include: { category: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <MemberNav currentPath="/member/pinjaman" userName={user.name} />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/member/dashboard"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Dashboard Warga</span>
            </Link>
            <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
              Riwayat Peminjaman Buku Anda
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Daftar seluruh transaksi peminjaman buku yang pernah Anda ajukan di TamanBaca Warga.
            </p>
          </div>

          <Link
            href="/katalog"
            className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            Pinjam Buku Lain
          </Link>
        </div>

        {/* Tabel / List Riwayat */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          {loans.length > 0 ? (
            <div className="divide-y divide-stone-100">
              {loans.map((loan) => (
                <div key={loan.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
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
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 mb-1">
                        {loan.book.category.name}
                      </span>
                      <h3 className="text-sm font-bold text-stone-800">
                        {loan.book.title}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        {loan.book.author} ({loan.book.year})
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-stone-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-stone-400" />
                          <span>
                            Diajukan:{" "}
                            {new Date(loan.requestDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </span>

                        {loan.loanDate && (
                          <span>
                            Dipinjam:{" "}
                            {new Date(loan.loanDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}

                        {loan.returnDate && (
                          <span>
                            Dikembalikan:{" "}
                            {new Date(loan.returnDate).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    {/* Status Badge */}
                    {loan.status === LoanStatus.PENDING && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Menunggu Persetujuan</span>
                      </span>
                    )}

                    {loan.status === LoanStatus.BORROWED && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Sedang Dipinjam</span>
                      </span>
                    )}

                    {loan.status === LoanStatus.RETURNED && (
                      <div className="flex flex-col items-end">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Sudah Dikembalikan</span>
                        </span>
                        {loan.fine > 0 && (
                          <span className="text-[11px] font-semibold text-red-600 mt-1 flex items-center gap-1">
                            <Coins className="w-3 h-3" />
                            <span>Denda: Rp{loan.fine.toLocaleString("id-ID")}</span>
                          </span>
                        )}
                      </div>
                    )}

                    {loan.status === LoanStatus.REJECTED && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-red-700 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Pengajuan Ditolak</span>
                      </span>
                    )}

                    {loan.status === LoanStatus.CANCELLED && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-stone-600 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Dibatalkan</span>
                      </span>
                    )}

                    {/* Tombol Batalkan Mandiri jika status masih PENDING */}
                    {loan.status === LoanStatus.PENDING && (
                      <CancelLoanButton loanId={loan.id} bookTitle={loan.book.title} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-stone-400 text-xs">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <span>Belum ada catatan riwayat peminjaman buku.</span>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
