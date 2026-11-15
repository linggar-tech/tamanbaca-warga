import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { DashboardCharts } from "@/components/admin/DashboardCharts";
import {
  BookOpen,
  Users,
  CalendarCheck2,
  AlertTriangle,
  ShieldCheck,
  Plus,
  ArrowRight,
  FileBarChart2,
  Sparkles,
} from "lucide-react";
import { LoanStatus } from "@prisma/client";

export default async function AdminDashboardPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const now = new Date();

  // 1. Metrik Ringkasan Utama
  const [
    totalBooks,
    totalMembers,
    activeLoansCount,
    overdueLoansCount,
    allLoansForStats,
    popularBookGroups,
    recentAuditLogs,
  ] = await Promise.all([
    prisma.book.count(),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.loan.count({ where: { status: LoanStatus.BORROWED } }),
    prisma.loan.count({
      where: {
        status: LoanStatus.BORROWED,
        dueDate: { lt: now },
      },
    }),
    // Ambil data pinjaman untuk statistik bulanan (6 bulan terakhir)
    prisma.loan.findMany({
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    // 5 Buku Terpopuler
    prisma.loan.groupBy({
      by: ["bookId"],
      _count: { bookId: true },
      orderBy: {
        _count: { bookId: "desc" },
      },
      take: 5,
    }),
    // 5 Audit Log Terakhir
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  // 2. Olah Data Tren Bulanan
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
    "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
  ];

  const monthlyCounts: Record<string, number> = {};
  // Siapkan 6 bulan terakhir
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    monthlyCounts[key] = 0;
  }

  allLoansForStats.forEach((loan) => {
    const d = new Date(loan.createdAt);
    const key = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
    if (monthlyCounts[key] !== undefined) {
      monthlyCounts[key] += 1;
    }
  });

  const monthlyLoansData = Object.entries(monthlyCounts).map(([month, total]) => ({
    month,
    total,
  }));

  // 3. Olah Data Top 5 Buku
  const popularBookIds = popularBookGroups.map((g) => g.bookId);
  const bookTitles = await prisma.book.findMany({
    where: { id: { in: popularBookIds } },
    select: { id: true, title: true },
  });

  const bookTitleMap = new Map(bookTitles.map((b) => [b.id, b.title]));

  const popularBooksData = popularBookGroups.map((g) => ({
    title: bookTitleMap.get(g.bookId) || "Buku",
    count: g._count.bookId,
  }));

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/dashboard" adminName={user.name} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        {/* Banner Selamat Datang */}
        <div className="bg-gradient-to-r from-emerald-800 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-sm mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-3 border border-emerald-600/40">
              <ShieldCheck className="w-4 h-4 text-emerald-300" />
              <span>Sistem Manajemen Perpustakaan Terverifikasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Dashboard Administrator
            </h1>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 max-w-xl">
              Ringkasan statistik real-time sirkulasi buku, kepatuhan batas waktu pengembalian, dan aktivitas siber.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/admin/laporan"
              className="py-2.5 px-4 bg-white text-emerald-900 font-semibold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors flex items-center gap-1.5"
            >
              <FileBarChart2 className="w-4 h-4" />
              <span>Rekap Laporan</span>
            </Link>
            <Link
              href="/admin/buku/tambah"
              className="py-2.5 px-4 bg-emerald-700/80 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl border border-emerald-600/60 transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Buku</span>
            </Link>
          </div>
        </div>

        {/* 4 Kartu Metrik Utama */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Total Koleksi Buku</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                <BookOpen className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-800 mt-2">
              {totalBooks}
            </div>
            <Link
              href="/admin/buku"
              className="text-[11px] font-semibold text-emerald-700 hover:underline mt-2 inline-flex items-center gap-1"
            >
              <span>Kelola koleksi</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Anggota Terdaftar</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-stone-800 mt-2">
              {totalMembers}
            </div>
            <Link
              href="/admin/anggota"
              className="text-[11px] font-semibold text-blue-700 hover:underline mt-2 inline-flex items-center gap-1"
            >
              <span>Kelola anggota</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Pinjaman Aktif</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                <CalendarCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-800 mt-2">
              {activeLoansCount}
            </div>
            <Link
              href="/admin/peminjaman?status=BORROWED"
              className="text-[11px] font-semibold text-amber-700 hover:underline mt-2 inline-flex items-center gap-1"
            >
              <span>Lihat pinjaman</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-500">Pinjaman Terlambat</span>
              <div className="p-2 rounded-xl bg-red-50 text-red-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-red-700 mt-2">
              {overdueLoansCount}
            </div>
            <span className="text-[11px] text-red-600 mt-2 block font-medium">
              {overdueLoansCount > 0 ? "Melewati batas jatuh tempo" : "Semua tepat waktu"}
            </span>
          </div>
        </div>

        {/* Visualisasi Grafik Recharts */}
        <div className="mb-8">
          <DashboardCharts
            monthlyLoans={monthlyLoansData}
            popularBooks={popularBooksData}
          />
        </div>

        {/* Audit Log Terakhir Ringkas */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <h3 className="text-sm font-bold text-stone-800">
                Catatan Aktivitas Sistem Terakhir (Audit Trail)
              </h3>
            </div>
            <Link
              href="/admin/audit-log"
              className="text-xs font-semibold text-emerald-700 hover:underline flex items-center gap-1"
            >
              <span>Buka Audit Log Lengkap</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="divide-y divide-stone-100 text-xs">
            {recentAuditLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded font-mono font-semibold bg-stone-100 text-stone-700 text-[10px]">
                    {log.action}
                  </span>
                  <span className="text-stone-700 line-clamp-1">
                    {log.details || `Operasi pada entitas ${log.entity}`}
                  </span>
                </div>
                <div className="text-stone-400 text-[11px] whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
