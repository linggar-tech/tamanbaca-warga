"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { UserPlus, AlertCircle, CheckCircle2, User, Mail, Lock, ShieldCheck } from "lucide-react";
import { registerAction, AuthActionResult } from "@/actions/auth";

export default function RegisterPage() {
  const [state, formAction, isPending] = useActionState<AuthActionResult | null, FormData>(
    registerAction,
    null
  );

  const [password, setPassword] = useState("");

  const hasMinLength = password.length >= 10;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-stone-800 tracking-tight">Daftar Anggota Warga</h2>
        <p className="text-sm text-stone-500 mt-1">
          Dapatkan akses peminjaman buku dan kegiatan literasi warga.
        </p>
      </div>

      {state && !state.success && state.message && (
        <div className="mb-5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-600" />
          <div className="leading-snug">{state.message}</div>
        </div>
      )}

      {state && state.success && (
        <div className="mb-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Pendaftaran Berhasil!</span>
          </div>
          <p className="mt-1 text-xs text-emerald-700">
            {state.message} Silakan lanjut masuk melalui tombol di bawah.
          </p>
          <div className="mt-3">
            <Link
              href="/login"
              className="inline-block py-2 px-4 bg-emerald-700 text-white rounded-lg text-xs font-semibold hover:bg-emerald-800 transition-colors"
            >
              Masuk Sekarang →
            </Link>
          </div>
        </div>
      )}

      {!state?.success && (
        <form action={formAction} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
              Nama Lengkap
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="name"
                required
                placeholder="Contoh: Budi Santoso"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-stone-400"
              />
            </div>
            {state?.errors?.name && (
              <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.name[0]}</p>
            )}
          </div>

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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="Minimal 10 karakter (huruf & angka)"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-300 text-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:border-transparent transition-all placeholder:text-stone-400"
              />
            </div>
            {state?.errors?.password && (
              <p className="text-xs text-red-600 mt-1 font-medium">{state.errors.password[0]}</p>
            )}

            {/* Indikator Keamanan Password */}
            <div className="mt-2.5 p-2.5 bg-stone-50 rounded-lg border border-stone-200 text-xs space-y-1">
              <div className="font-semibold text-stone-600 flex items-center gap-1 mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-stone-500" />
                <span>Standar Keamanan Password:</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
                <span>{hasMinLength ? "✓" : "○"}</span>
                <span>Minimal 10 karakter</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasLetter ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
                <span>{hasLetter ? "✓" : "○"}</span>
                <span>Mengandung huruf (A-Z / a-z)</span>
              </div>
              <div className={`flex items-center gap-1.5 ${hasNumber ? "text-emerald-700 font-medium" : "text-stone-400"}`}>
                <span>{hasNumber ? "✓" : "○"}</span>
                <span>Mengandung angka (0-9)</span>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPending || (!isPasswordValid && password.length > 0)}
              className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isPending ? (
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              <span>{isPending ? "Mendaftarkan Akun..." : "Daftar Sekarang"}</span>
            </button>
          </div>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-stone-200 text-center">
        <p className="text-sm text-stone-600">
          Sudah memiliki akun?{" "}
          <Link
            href="/login"
            className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  );
}
