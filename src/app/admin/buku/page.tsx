import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { BookTable } from "@/components/admin/BookTable";
import { BookCopy, Plus, Search } from "lucide-react";

interface AdminBooksPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminBooksPage({ searchParams }: AdminBooksPageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const q = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q.trim() : "";

  const whereCondition: any = {};
  if (q) {
    whereCondition.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
      { isbn: { contains: q, mode: "insensitive" } },
    ];
  }

  const books = await prisma.book.findMany({
    where: whereCondition,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      author: true,
      publisher: true,
      year: true,
      isbn: true,
      stock: true,
      category: {
        select: { name: true },
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/buku" adminName={user.name} />

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
              <BookCopy className="w-5 h-5" />
              <h1>Manajemen Koleksi Buku</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Kelola judul buku, penulis, stok ketersediaan, dan sampul perpustakaan warga.
            </p>
          </div>

          <Link
            href="/admin/buku/tambah"
            className="inline-flex items-center gap-2 py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Buku Baru</span>
          </Link>
        </div>

        {/* Pencarian */}
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200/80 shadow-xs mb-6">
          <form method="GET" action="/admin/buku" className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari berdasarkan judul, pengarang, atau ISBN..."
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
                href="/admin/buku"
                className="py-1.5 px-3 text-stone-500 hover:text-stone-700 text-xs flex items-center"
              >
                Reset
              </Link>
            )}
          </form>
        </div>

        <BookTable books={books} />
      </main>
    </div>
  );
}
