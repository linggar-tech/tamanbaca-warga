import Link from "next/link";
import { BookOpen, Home, Search } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-3xl flex items-center justify-center mb-6 shadow-xs border border-emerald-200">
        <BookOpen className="w-8 h-8" />
      </div>

      <span className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
        404 - Halaman Tidak Ditemukan
      </span>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-800 tracking-tight mt-2">
        Halaman yang Anda Cari Tidak Ada
      </h1>

      <p className="mt-3 text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
        Tautan mungkin telah kedaluwarsa, buku telah dipindahkan, atau alamat URL yang dimasukkan salah.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/katalog"
          className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          <span>Jelajahi Katalog Buku</span>
        </Link>

        <Link
          href="/"
          className="py-2.5 px-5 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs rounded-xl border border-stone-300 shadow-xs transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4 text-stone-400" />
          <span>Ke Halaman Utama</span>
        </Link>
      </div>
    </div>
  );
}
