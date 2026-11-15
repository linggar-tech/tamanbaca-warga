import Link from "next/link";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MemberNav } from "@/components/layout/MemberNav";
import { LoanRequestForm } from "@/components/member/LoanRequestForm";
import { ArrowLeft, BookOpen, ShieldCheck } from "lucide-react";

interface LoanApplyPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function LoanApplyPage({ searchParams }: LoanApplyPageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedSearchParams = await searchParams;
  const bookId = typeof resolvedSearchParams.bookId === "string" ? resolvedSearchParams.bookId : null;

  if (!bookId) {
    redirect("/katalog");
  }

  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: { category: true },
  });

  if (!book) {
    notFound();
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <MemberNav currentPath="/member/pinjaman" userName={user.name} />

      <main className="max-w-2xl w-full mx-auto px-4 sm:px-6 py-10 flex-1">
        <div className="mb-6">
          <Link
            href={`/katalog/${book.id}`}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-emerald-700 transition-colors mb-3"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Detail Buku</span>
          </Link>
          <h1 className="text-2xl font-bold text-stone-800 tracking-tight">
            Konfirmasi Pengajuan Peminjaman
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Pastikan data buku yang akan Anda pinjam sudah sesuai.
          </p>
        </div>

        {/* Ringkasan Buku */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6 mb-6">
          <div className="flex gap-4">
            <div className="relative w-20 h-28 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200">
              {book.coverUrl ? (
                <Image
                  src={book.coverUrl}
                  alt={book.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-400">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
            </div>

            <div className="flex-1">
              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 mb-1">
                {book.category.name}
              </span>
              <h2 className="text-base font-bold text-stone-800 leading-snug">
                {book.title}
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Karya {book.author} • Penerbit {book.publisher} ({book.year})
              </p>
              <div className="mt-3 flex items-center gap-2 text-xs">
                <span className="text-stone-500">Stok Tersedia:</span>
                <span className="font-bold text-emerald-700">{book.stock} eksemplar</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Eksekusi */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6">
          <LoanRequestForm
            bookId={book.id}
            bookTitle={book.title}
            stock={book.stock}
          />
        </div>
      </main>
    </div>
  );
}
