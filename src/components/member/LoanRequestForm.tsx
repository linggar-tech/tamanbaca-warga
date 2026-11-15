"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookmarkPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { requestLoanAction, LoanActionResult } from "@/actions/loans";

export function LoanRequestForm({ bookId, bookTitle, stock }: { bookId: string; bookTitle: string; stock: number }) {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<LoanActionResult | null, FormData>(
    requestLoanAction,
    null
  );

  useEffect(() => {
    if (state?.success) {
      const timer = setTimeout(() => {
        router.push("/member/pinjaman");
        router.refresh();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [state, router]);

  if (stock <= 0) {
    return (
      <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs">
        <p className="font-semibold">Stok Buku Habis</p>
        <p className="mt-1">
          Buku ini sedang tidak tersedia untuk dipinjam karena seluruh eksemplar sedang berada di tangan warga lain.
        </p>
        <div className="mt-3">
          <Link
            href="/katalog"
            className="inline-block py-1.5 px-3 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800"
          >
            Cari Buku Lain
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {state && !state.success && state.message && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{state.message}</span>
        </div>
      )}

      {state && state.success && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
          <span>{state.message} Mengalihkan ke riwayat pinjaman...</span>
        </div>
      )}

      <form action={formAction}>
        <input type="hidden" name="bookId" value={bookId} />

        <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-600 space-y-2 mb-4">
          <div className="font-semibold text-stone-800">Ketentuan Peminjaman:</div>
          <ul className="list-disc list-inside space-y-1 text-stone-500">
            <li>Maksimal durasi peminjaman adalah <strong>7 hari kalender</strong> sejak disetujui pengelola.</li>
            <li>Setiap warga maksimal meminjam <strong>3 buku secara bersamaan</strong>.</li>
            <li>Keterlambatan pengembalian dikenakan denda sesuai peraturan taman baca.</li>
          </ul>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/katalog/${bookId}`}
            className="py-2.5 px-4 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-xl transition-colors"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={isPending || state?.success}
            className="flex-1 py-2.5 px-6 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <BookmarkPlus className="w-4 h-4" />
            )}
            <span>{isPending ? "Mengirim Pengajuan..." : `Ajukan Pinjam "${bookTitle}"`}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
