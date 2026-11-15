import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  Terminal,
} from "lucide-react";

interface AuditLogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AuditLogPage({ searchParams }: AuditLogPageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";
  const actionFilter = typeof resolvedSearchParams.action === "string" ? resolvedSearchParams.action : "";
  const pageParam = typeof resolvedSearchParams.page === "string" ? parseInt(resolvedSearchParams.page, 10) : 1;
  const page = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const limit = 15;
  const skip = (page - 1) * limit;

  const whereCondition: any = {};

  if (q) {
    whereCondition.OR = [
      { details: { contains: q, mode: "insensitive" } },
      { ipAddress: { contains: q, mode: "insensitive" } },
      { user: { name: { contains: q, mode: "insensitive" } } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  if (actionFilter) {
    whereCondition.action = actionFilter;
  }

  const [totalLogs, logs, distinctActions] = await Promise.all([
    prisma.auditLog.count({ where: whereCondition }),
    prisma.auditLog.findMany({
      where: whereCondition,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
    }),
    prisma.auditLog.groupBy({
      by: ["action"],
      _count: { action: true },
    }),
  ]);

  const totalPages = Math.ceil(totalLogs / limit) || 1;

  // Helper untuk warna badge action
  const getActionBadgeColor = (act: string) => {
    if (act.includes("LOCKED") || act.includes("FAILED") || act.includes("DELETE")) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (act.includes("SUCCESS") || act.includes("APPROVED") || act.includes("CREATE")) {
      return "bg-emerald-50 text-emerald-800 border-emerald-200";
    }
    if (act.includes("LOAN") || act.includes("RETURN")) {
      return "bg-blue-50 text-blue-800 border-blue-200";
    }
    return "bg-stone-100 text-stone-700 border-stone-200";
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/audit-log" adminName={user.name} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
              <ShieldAlert className="w-5 h-5" />
              <h1>Log Aktivitas Sistem & Audit Trail</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Pencatatan riwayat autentikasi, transaksi peminjaman, mutasi buku, dan aktivitas penguncian akun (Poin Keamanan 11).
            </p>
          </div>

          <div className="text-xs font-mono bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg text-stone-600 self-start sm:self-auto">
            Total Entri: <strong>{totalLogs}</strong>
          </div>
        </div>

        {/* Filter & Pencarian Bar */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-xs mb-6">
          <form method="GET" action="/admin/audit-log" className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari detail aktivitas, alamat IP, atau nama pengguna..."
                className="w-full pl-10 pr-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div className="relative min-w-[220px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Filter className="w-4 h-4" />
              </div>
              <select
                name="action"
                defaultValue={actionFilter}
                className="w-full pl-10 pr-8 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
              >
                <option value="">Semua Jenis Aksi</option>
                {distinctActions.map((act) => (
                  <option key={act.action} value={act.action}>
                    {act.action} ({act._count.action})
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="py-2 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Cari</span>
            </button>

            {(q || actionFilter) && (
              <Link
                href="/admin/audit-log"
                className="py-2 px-3 text-stone-500 hover:text-stone-700 text-xs flex items-center justify-center"
              >
                Reset
              </Link>
            )}
          </form>
        </div>

        {/* Tabel Audit Log */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Waktu (WIB)</th>
                  <th className="py-3 px-4">Aksi Peristiwa</th>
                  <th className="py-3 px-4">Pengguna / Subjek</th>
                  <th className="py-3 px-4">Alamat IP</th>
                  <th className="py-3 px-4">Rincian Deskripsi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-mono">
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-stone-400" />
                          <span>
                            {new Date(log.createdAt).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                              second: "2-digit",
                            })}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadgeColor(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-sans">
                        {log.user ? (
                          <div>
                            <div className="font-semibold text-stone-800 flex items-center gap-1">
                              <User className="w-3 h-3 text-stone-400" />
                              <span>{log.user.name}</span>
                            </div>
                            <div className="text-[11px] text-stone-400">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-stone-400 italic">Sistem / Tamu</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-600 text-[11px]">
                        {log.ipAddress || "127.0.0.1"}
                      </td>

                      <td className="py-3 px-4 font-sans text-stone-700 text-xs">
                        {log.details || "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-10 text-center text-stone-400 font-sans text-xs">
                      Tidak ada catatan log aktivitas yang sesuai dengan kriteria filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Log */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-stone-200/80 flex items-center justify-between text-xs text-stone-600">
              <div>
                Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong> (Total {totalLogs} entri)
              </div>

              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    href={`/admin/audit-log?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${
                      actionFilter ? `&action=${actionFilter}` : ""
                    }`}
                    className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1 font-semibold"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </Link>
                ) : (
                  <span className="py-1.5 px-3 bg-stone-50 text-stone-300 rounded-lg flex items-center gap-1 cursor-not-allowed">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya</span>
                  </span>
                )}

                {page < totalPages ? (
                  <Link
                    href={`/admin/audit-log?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${
                      actionFilter ? `&action=${actionFilter}` : ""
                    }`}
                    className="py-1.5 px-3 bg-stone-100 hover:bg-stone-200 rounded-lg flex items-center gap-1 font-semibold"
                  >
                    <span>Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <span className="py-1.5 px-3 bg-stone-50 text-stone-300 rounded-lg flex items-center gap-1 cursor-not-allowed">
                    <span>Berikutnya</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
