import Link from "next/link";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { BookCoverImage } from "@/components/books/BookCoverImage";
import { BookOpen, ShieldCheck, Users, ArrowRight, BookCheck, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Ambil statistik ringkas dan 4 buku terbaru dari database Neon (tanpa menarik kolom coverUrl)
  const [totalBooks, totalMembers, totalLoans, latestBooks] = await Promise.all([
    prisma.book.count(),
    prisma.user.count({ where: { role: "MEMBER" } }),
    prisma.loan.count(),
    prisma.book.findMany({
      take: 4,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        author: true,
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

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <Navbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 border-b border-stone-200/60 bg-gradient-to-b from-emerald-50/40 via-stone-50/20 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold mb-6 shadow-xs border border-emerald-200/80">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Sistem Manajemen Perpustakaan Warga Aman & Tepercaya</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-stone-800 tracking-tight leading-[1.15] max-w-4xl">
              Tingkatkan Literasi Warga, Akses Ratusan Koleksi Buku dengan Mudah
            </h1>

            <p className="mt-5 text-stone-600 text-base sm:text-lg max-w-2xl leading-relaxed">
              Platform modern pengelolaan taman bacaan masyarakat. Peminjaman transparan, pencatatan otomatis, dan dirancang dengan standar keamanan siber terlindungi.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                href="/katalog"
                className="py-3 px-6 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-xl shadow-md shadow-emerald-700/20 transition-all flex items-center gap-2 text-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Jelajahi Katalog Buku</span>
              </Link>
              <Link
                href="/register"
                className="py-3 px-6 bg-white hover:bg-stone-50 text-stone-700 font-semibold rounded-xl border border-stone-300 shadow-xs transition-all text-sm flex items-center gap-2"
              >
                <span>Daftar Anggota Warga</span>
                <ArrowRight className="w-4 h-4 text-stone-400" />
              </Link>
            </div>

            {/* Statistik Ringkas */}
            <div className="mt-14 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl w-full pt-8 border-t border-stone-200/80">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{totalBooks}</div>
                <div className="text-xs text-stone-500 font-medium mt-0.5">Judul Buku</div>
              </div>
              <div className="text-center border-x border-stone-200/80">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{totalMembers}</div>
                <div className="text-xs text-stone-500 font-medium mt-0.5">Anggota Terdaftar</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-emerald-800">{totalLoans}</div>
                <div className="text-xs text-stone-500 font-medium mt-0.5">Transaksi Pinjam</div>
              </div>
            </div>
          </div>
        </section>

        {/* Koleksi Buku Terbaru */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Koleksi Terbaru</span>
              </div>
              <h2 className="text-2xl font-bold text-stone-800 tracking-tight">
                Buku yang Baru Saja Masuk ke Rak
              </h2>
            </div>
            <Link
              href="/katalog"
              className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <span>Lihat Semua Buku</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestBooks.map((book) => (
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
                      {book.stock > 0 ? `Stok: ${book.stock}` : "Habis"}
                    </span>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {book.category.name}
                    </span>
                    <h3 className="font-bold text-stone-800 text-sm mt-2 line-clamp-1 group-hover:text-emerald-800 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1 line-clamp-1">
                      Karya {book.author} ({book.year})
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
                    <span className="text-xs text-stone-400">
                      ISBN: {book.isbn || "-"}
                    </span>
                    <Link
                      href={`/katalog/${book.id}`}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Detail →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Keamanan & Fitur Unggulan */}
        <section className="bg-stone-100/70 border-y border-stone-200/80 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl font-bold text-stone-800">
                Pilar Keamanan & Keandalan Sistem
              </h2>
              <p className="text-stone-600 text-sm mt-2">
                Dibangun sebagai contoh implementasi arsitektur sistem informasi yang mematuhi standar keamanan siber.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-800 text-base mb-1">Defense-in-Depth RBAC</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Hak akses diverifikasi pada gerbang perimeter middleware dan diverifikasi ulang secara independen di setiap Server Action & query database.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                  <BookCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-800 text-base mb-1">Upload Sampul Tervalidasi</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Mengecek header biner file (*Magic Bytes*) asli di server, membatasi ukuran maksimal 1 MB, dan menamai file dengan UUID acak.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-white border border-stone-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-800 text-base mb-1">Audit Trail & Forensik</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Setiap aktivitas penambahan, perubahan, dan penghapusan buku serta login terekam otomatis pada tabel AuditLog dengan alamat IP.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
