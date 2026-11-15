import Link from "next/link";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookCoverImage } from "@/components/books/BookCoverImage";
import {
  BookOpen,
  ArrowLeft,
  Calendar,
  Building,
  User,
  Barcode,
  CheckCircle2,
  XCircle,
  BookmarkPlus,
} from "lucide-react";

interface BookDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookDetailPage({ params }: BookDetailPageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  // Query buku berdasarkan id (tanpa menarik kolom coverUrl)
  const book = await prisma.book.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      author: true,
      publisher: true,
      year: true,
      isbn: true,
      stock: true,
      description: true,
      category: true,
    },
  });

  if (!book) {
    notFound();
  }

  const isAvailable = book.stock > 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Tombol Navigasi Kembali */}
        <div className="mb-6">
          <Link
            href="/katalog"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-emerald-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Katalog Buku</span>
          </Link>
        </div>

        {/* Card Detail Buku */}
        <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs overflow-hidden p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Kolom Sampul Buku */}
            <div className="md:col-span-1">
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-stone-100 shadow-sm border border-stone-200/60">
                <BookCoverImage
                  bookId={book.id}
                  title={book.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  priority
                />
              </div>

              {/* Status Ketersediaan */}
              <div className="mt-4 p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-medium bg-stone-50 border-stone-200">
                {isAvailable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-stone-700">
                      Tersedia untuk dipinjam (Sisa: <strong>{book.stock}</strong> eks.)
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                    <span className="text-red-700">
                      Stok sedang habis dipinjam warga lain.
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Kolom Informasi Detail */}
            <div className="md:col-span-2 flex flex-col justify-between">
              <div>
                <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-semibold mb-3 border border-emerald-100">
                  {book.category.name}
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 tracking-tight leading-snug">
                  {book.title}
                </h1>

                {/* Metadata Grid */}
                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs text-stone-600">
                  <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                    <User className="w-4 h-4 text-stone-400" />
                    <div>
                      <span className="text-stone-400 block text-[11px]">Pengarang</span>
                      <strong className="text-stone-700">{book.author}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                    <Building className="w-4 h-4 text-stone-400" />
                    <div>
                      <span className="text-stone-400 block text-[11px]">Penerbit</span>
                      <strong className="text-stone-700">{book.publisher}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                    <Calendar className="w-4 h-4 text-stone-400" />
                    <div>
                      <span className="text-stone-400 block text-[11px]">Tahun Terbit</span>
                      <strong className="text-stone-700">{book.year}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                    <Barcode className="w-4 h-4 text-stone-400" />
                    <div>
                      <span className="text-stone-400 block text-[11px]">Nomor ISBN</span>
                      <strong className="text-stone-700">{book.isbn || "-"}</strong>
                    </div>
                  </div>
                </div>

                {/* Sinopsis / Deskripsi */}
                <div className="mt-6">
                  <h3 className="text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
                    Sinopsis & Deskripsi Buku
                  </h3>
                  <div className="text-stone-600 text-sm leading-relaxed whitespace-pre-line bg-stone-50/50 p-4 rounded-2xl border border-stone-100">
                    {book.description || "Belum ada deskripsi untuk buku ini."}
                  </div>
                </div>
              </div>

              {/* Action Card Peminjaman */}
              <div className="mt-8 pt-6 border-t border-stone-200">
                {user ? (
                  user.role === "MEMBER" ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/60">
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900">Ingin membaca buku ini?</h4>
                        <p className="text-xs text-emerald-700 mt-0.5">
                          Ajukan peminjaman buku (kuota maksimal 3 peminjaman aktif).
                        </p>
                      </div>
                      <Link
                        href={`/member/pinjaman/ajukan?bookId=${book.id}`}
                        className={`py-2.5 px-5 rounded-xl font-semibold text-xs shadow-xs transition-all flex items-center gap-2 flex-shrink-0 ${
                          isAvailable
                            ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                            : "bg-stone-300 text-stone-500 cursor-not-allowed pointer-events-none"
                        }`}
                      >
                        <BookmarkPlus className="w-4 h-4" />
                        <span>{isAvailable ? "Ajukan Peminjaman" : "Stok Habis"}</span>
                      </Link>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-200">
                      <span className="text-xs text-stone-600">
                        Anda sedang login sebagai <strong>Administrator</strong>.
                      </span>
                      <Link
                        href={`/admin/buku/${book.id}/edit`}
                        className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl"
                      >
                        Edit Data Buku Ini
                      </Link>
                    </div>
                  )
                ) : (
                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <span className="text-stone-600">
                      Silakan masuk atau daftar sebagai warga untuk dapat meminjam koleksi buku ini.
                    </span>
                    <div className="flex items-center gap-2">
                      <Link
                        href="/login"
                        className="py-2 px-3.5 bg-emerald-700 text-white font-semibold rounded-lg hover:bg-emerald-800 transition-colors"
                      >
                        Masuk
                      </Link>
                      <Link
                        href="/register"
                        className="py-2 px-3.5 bg-white border border-stone-300 text-stone-700 font-semibold rounded-lg hover:bg-stone-50 transition-colors"
                      >
                        Daftar Warga
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
