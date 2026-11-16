import Link from "next/link";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookCoverImage } from "@/components/books/BookCoverImage";
import { catalogQuerySchema } from "@/schemas/catalog.schema";
import { Search, Filter, BookOpen, ChevronLeft, ChevronRight, X } from "lucide-react";

interface CatalogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const resolvedSearchParams = await searchParams;

  // 1. Validasi parameter URL dengan Zod (Poin Keamanan 2)
  const queryResult = catalogQuerySchema.safeParse({
    q: typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "",
    category: typeof resolvedSearchParams.category === "string" ? resolvedSearchParams.category : "",
    page: resolvedSearchParams.page,
    limit: 8,
  });

  const { q, category, page, limit } = queryResult.success
    ? queryResult.data
    : { q: "", category: "", page: 1, limit: 8 };

  // 2. Bangun kondisi filter Prisma yang aman (Parameterized)
  const whereCondition: any = {};

  if (q) {
    whereCondition.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { author: { contains: q, mode: "insensitive" } },
      { publisher: { contains: q, mode: "insensitive" } },
    ];
  }

  if (category) {
    whereCondition.categoryId = category;
  }

  // 3. Eksekusi query dengan paginasi
  const skip = (page - 1) * limit;

  let categories: { id: string; name: string }[] = [];
  let totalBooks = 0;
  let books: {
    id: string;
    title: string;
    author: string;
    publisher: string;
    year: number;
    isbn: string | null;
    stock: number;
    category: {
      name: string;
    };
  }[] = [];
  let isDbConnected = true;

  try {
    const results = await Promise.all([
      prisma.category.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.book.count({ where: whereCondition }),
      prisma.book.findMany({
        where: whereCondition,
        skip,
        take: limit,
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
            select: {
              name: true,
            },
          },
        },
      }),
    ]);
    categories = results[0];
    totalBooks = results[1];
    books = results[2];
  } catch (error) {
    isDbConnected = false;
    console.error("[Database Connection Warning in Katalog]:", error);
  }

  const totalPages = Math.ceil(totalBooks / limit) || 1;

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {!isDbConnected && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-6 text-center text-xs text-amber-900">
            ⚠️ <strong>Perhatian Sistem:</strong> Koneksi database belum terhubung. Pastikan variabel lingkungan <code>DATABASE_URL</code> sudah disetel di Vercel Dashboard (<em>Project Settings &gt; Environment Variables</em>).
          </div>
        )}
        {/* Header Katalog */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-stone-800 tracking-tight">Katalog Koleksi Buku</h1>
          <p className="text-sm text-stone-600 mt-1">
            Temukan berbagai buku bacaan, referensi sains, sastra, hingga teknologi yang tersedia di taman baca warga.
          </p>
        </div>

        {/* Bar Pencarian & Filter */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-stone-200/80 shadow-xs mb-8">
          <form method="GET" action="/katalog" className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Cari judul buku, nama pengarang, atau penerbit..."
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-stone-400"
              />
              {q && (
                <Link
                  href={`/katalog${category ? `?category=${category}` : ""}`}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600"
                >
                  <X className="w-4 h-4" />
                </Link>
              )}
            </div>

            <div className="relative min-w-[200px]">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <Filter className="w-4 h-4" />
              </div>
              <select
                name="category"
                defaultValue={category}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all bg-white appearance-none cursor-pointer"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <span>Terapkan</span>
            </button>
          </form>
        </div>

        {/* Ringkasan Hasil Pencarian */}
        <div className="flex items-center justify-between mb-6 text-xs text-stone-500">
          <div>
            Menampilkan <strong>{books.length}</strong> dari total <strong>{totalBooks}</strong> buku
            {q && (
              <span>
                {" "}
                untuk kata kunci &ldquo;<strong>{q}</strong>&rdquo;
              </span>
            )}
          </div>
          {(q || category) && (
            <Link
              href="/katalog"
              className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline flex items-center gap-1"
            >
              Reset Filter
            </Link>
          )}
        </div>

        {/* Grid Buku */}
        {books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {books.map((book) => (
              <div
                key={book.id}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
              >
                <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
                  <BookCoverImage
                    bookId={book.id}
                    title={book.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />

                  <div className="absolute top-2.5 right-2.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-md shadow-xs ${
                        book.stock > 0
                          ? "bg-emerald-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {book.stock > 0 ? `Tersedia: ${book.stock}` : "Habis"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {book.category.name}
                    </span>
                    <h3 className="font-bold text-stone-800 text-sm mt-2 line-clamp-2 group-hover:text-emerald-800 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                      {book.author} • {book.publisher} ({book.year})
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-[11px] text-stone-400">
                      ISBN: {book.isbn || "-"}
                    </span>
                    <Link
                      href={`/katalog/${book.id}`}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Lihat Detail →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="bg-white rounded-2xl border border-stone-200/80 p-12 text-center max-w-md mx-auto my-12">
            <div className="w-16 h-16 bg-stone-100 text-stone-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-8 h-8 opacity-60" />
            </div>
            <h3 className="text-base font-bold text-stone-800">Buku Tidak Ditemukan</h3>
            <p className="text-xs text-stone-500 mt-1.5 leading-relaxed">
              Kami tidak menemukan koleksi yang sesuai dengan kriteria pencarian atau filter yang Anda pilih.
            </p>
            <div className="mt-5">
              <Link
                href="/katalog"
                className="inline-block py-2 px-4 bg-emerald-700 text-white text-xs font-semibold rounded-xl hover:bg-emerald-800 transition-colors"
              >
                Tampilkan Semua Buku
              </Link>
            </div>
          </div>
        )}

        {/* Pagination Aman */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-center gap-2">
            {page > 1 ? (
              <Link
                href={`/katalog?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${category ? `&category=${category}` : ""}`}
                className="py-2 px-3 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1 shadow-xs"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </Link>
            ) : (
              <span className="py-2 px-3 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-400 flex items-center gap-1 cursor-not-allowed">
                <ChevronLeft className="w-4 h-4" />
                <span>Sebelumnya</span>
              </span>
            )}

            <span className="text-xs text-stone-600 px-3">
              Halaman <strong>{page}</strong> dari <strong>{totalPages}</strong>
            </span>

            {page < totalPages ? (
              <Link
                href={`/katalog?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ""}${category ? `&category=${category}` : ""}`}
                className="py-2 px-3 bg-white border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-50 flex items-center gap-1 shadow-xs"
              >
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            ) : (
              <span className="py-2 px-3 bg-stone-100 border border-stone-200 rounded-lg text-xs text-stone-400 flex items-center gap-1 cursor-not-allowed">
                <span>Berikutnya</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
