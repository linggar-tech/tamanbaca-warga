"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertOctagon, RotateCcw, Home } from "lucide-react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Catat error di console server/monitoring internal tanpa membocorkannya ke DOM publik
    console.error("[INTERNAL APPLICATION ERROR]:", error.message);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-16 h-16 bg-red-100 text-red-700 rounded-3xl flex items-center justify-center mb-6 shadow-xs border border-red-200">
        <AlertOctagon className="w-8 h-8" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-stone-800 tracking-tight">
        Terjadi Kesalahan pada Sistem
      </h1>

      {/* Keamanan Poin 13: Pesan generik tanpa stack trace atau detail query database */}
      <p className="mt-3 text-stone-600 text-sm max-w-md mx-auto leading-relaxed">
        Mohon maaf, permintaan Anda tidak dapat diproses saat ini. Tim pengelola telah mencatat peristiwa ini untuk ditinjau lebih lanjut.
      </p>

      {error.digest && (
        <p className="mt-2 text-xs font-mono text-stone-400">
          Kode Referensi Insiden: {error.digest}
        </p>
      )}

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="py-2.5 px-5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Muat Ulang Halaman</span>
        </button>

        <Link
          href="/"
          className="py-2.5 px-5 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs rounded-xl border border-stone-300 shadow-xs transition-colors flex items-center gap-2"
        >
          <Home className="w-4 h-4 text-stone-400" />
          <span>Kembali ke Beranda</span>
        </Link>
      </div>
    </div>
  );
}
