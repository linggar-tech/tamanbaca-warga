import Link from "next/link";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { BookForm } from "@/components/admin/BookForm";
import { ArrowLeft, BookPlus } from "lucide-react";

export default async function AdminAddBookPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/buku" adminName={user.name} />

      <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link
              href="/admin/buku"
              className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-700 transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Daftar Buku</span>
            </Link>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
              <BookPlus className="w-5 h-5" />
              <h1>Tambah Koleksi Buku Baru</h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Lengkapi formulir di bawah ini untuk mendaftarkan buku baru ke katalog perpustakaan.
            </p>
          </div>
        </div>

        <BookForm categories={categories} />
      </main>
    </div>
  );
}
