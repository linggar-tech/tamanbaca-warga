import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { MemberActionButtons } from "@/components/admin/MemberActionButtons";
import { Users, ShieldCheck, Lock, CheckCircle2, XCircle, Search } from "lucide-react";
import Link from "next/link";

interface AdminMembersPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminMembersPage({ searchParams }: AdminMembersPageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";

  const whereCondition: any = {};
  if (q) {
    whereCondition.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          loans: true,
        },
      },
    },
  });

  const now = new Date();

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/anggota" adminName={user.name} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
              <Users className="w-5 h-5" />
              <h1>Manajemen Anggota Warga</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Kelola status akun, buka kunci akun yang terblokir akibat brute-force, dan tinjau riwayat partisipasi.
            </p>
          </div>

          <div className="text-xs font-mono bg-stone-100 border border-stone-200 px-3 py-1.5 rounded-lg text-stone-600 self-start sm:self-auto">
            Total Pengguna: <strong>{users.length}</strong>
          </div>
        </div>

        {/* Pencarian Anggota */}
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs mb-6">
          <form method="GET" action="/admin/anggota" className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari berdasarkan nama atau alamat email anggota..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <button
              type="submit"
              className="py-1.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Cari
            </button>
            {q && (
              <Link
                href="/admin/anggota"
                className="py-1.5 px-3 text-stone-500 hover:text-stone-700 text-xs flex items-center"
              >
                Reset
              </Link>
            )}
          </form>
        </div>

        {/* Tabel Anggota */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="py-3 px-4">Nama & Email</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status Akun</th>
                  <th className="py-3 px-4">Status Keamanan</th>
                  <th className="py-3 px-4 text-center">Pinjaman</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {users.map((u) => {
                  const isLocked = Boolean(u.lockedUntil && u.lockedUntil > now);
                  const isTargetAdmin = u.role === "ADMIN";

                  return (
                    <tr key={u.id} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-800">{u.name}</div>
                        <div className="text-[11px] text-stone-400 font-mono">{u.email}</div>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                            isTargetAdmin
                              ? "bg-purple-50 text-purple-800 border border-purple-200"
                              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Aktif</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Dinonaktifkan</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {isLocked ? (
                          <div className="inline-flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Terkunci Sementara</span>
                          </div>
                        ) : (
                          <span className="text-stone-400 text-[11px]">Normal (0 gagal)</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-center font-bold text-stone-700">
                        {u._count.loans}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <MemberActionButtons
                          userId={u.id}
                          userName={u.name}
                          isActive={u.isActive}
                          isLocked={isLocked}
                          isAdmin={isTargetAdmin}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
