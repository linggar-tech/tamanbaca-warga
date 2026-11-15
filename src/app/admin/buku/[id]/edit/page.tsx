import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { BookForm } from "@/components/admin/BookForm";
import { ArrowLeft, Edit } from "lucide-react";

interface AdminEditBookPageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminEditBookPage({ params }: AdminEditBookPageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const { id } = await params;

  const [book, categories] = await Promise.all([
    prisma.book.findUnique({
      where: { id },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  if (!book) {
    notFound();
  }

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
              <Edit className="w-5 h-5" />
              <h1>Perbarui Data Buku</h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Mengubah data: <strong>{book.title}</strong>
            </p>
          </div>
        </div>

        <BookForm
          categories={categories}
          isEdit={true}
          initialData={{
            id: book.id,
            title: book.title,
            author: book.author,
            publisher: book.publisher,
            year: book.year,
            isbn: book.isbn,
            stock: book.stock,
            categoryId: book.categoryId,
            description: book.description,
            coverUrl: book.coverUrl ? `/api/buku/${book.id}/cover` : null,
          }}
        />
      </main>
    </div>
  );
}
