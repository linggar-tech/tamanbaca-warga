"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, AlertCircle, Lock, Mail } from "lucide-react";
import { loginAction, AuthActionResult } from "@/actions/auth";

export default function LoginPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    loginAction,
    null
  );

  useEffect(() => {
    if (state?.success && state.message) {
      // state.message berisi path tujuan redirect
      router.push(state.message);
      router.refresh();
    }
  }, [state, router]);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-800 tracking-tight">Masuk ke Akun Anda</h2>
        <p className="text-sm text-stone-500 mt-1">
          Gunakan email dan password terdaftar untuk mengakses layanan.
        </p>
      </div>

      {state && !state.success && state.message && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="leading-snug">{state.message}</div>
        </div>
      )}

      <form action={formAction} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Alamat Email
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="nama@email.com"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-stone-400"
            />
          </div>
          {state?.errors?.email && (
            <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.email[0]}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••••••"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-stone-400"
            />
          </div>
          {state?.errors?.password && (
            <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.password[0]}</p>
          )}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <LogIn className="w-4 h-4" />
            )}
            <span>{isPending ? "Memverifikasi..." : "Masuk"}</span>
          </button>
        </div>
      </form>

      <div className="mt-6 pt-5 border-t border-stone-200 text-center">
        <p className="text-sm text-stone-600">
          Belum menjadi anggota?{" "}
          <Link
            href="/register"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Daftar sebagai Warga
          </Link>
        </p>
        <div className="mt-3">
          <Link
            href="/"
            className="text-xs text-stone-500 hover:text-stone-700 transition-colors"
          >
            ← Kembali ke Halaman Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
