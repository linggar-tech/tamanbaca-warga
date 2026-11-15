"use client";

import { useActionState, useState } from "react";
import { User, Lock, CheckCircle2, AlertCircle, Save, KeyRound } from "lucide-react";
import { updateProfileAction, changePasswordAction, ProfileActionResult } from "@/actions/profile";

export function ProfileForm({ initialName, email }: { initialName: string; email: string }) {
  const [profileState, profileAction, isUpdatingProfile] = useActionState<ProfileActionResult | null, FormData>(
    updateProfileAction,
    null
  );

  const [passwordState, passwordAction, isChangingPassword] = useActionState<ProfileActionResult | null, FormData>(
    changePasswordAction,
    null
  );

  const [newPassword, setNewPassword] = useState("");
  const hasMinLength = newPassword.length >= 10;
  const hasLetter = /[a-zA-Z]/.test(newPassword);
  const hasNumber = /[0-9]/.test(newPassword);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Form Ubah Nama Profil */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6">
        <div className="flex items-center gap-2 text-stone-800 font-bold text-sm mb-4">
          <User className="w-4 h-4 text-emerald-700" />
          <h3>Informasi Akun Anda</h3>
        </div>

        {profileState && !profileState.success && profileState.message && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{profileState.message}</span>
          </div>
        )}

        {profileState && profileState.success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{profileState.message}</span>
          </div>
        )}

        <form action={profileAction} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Alamat Email (Permanen)
            </label>
            <input
              type="email"
              disabled
              value={email}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-100 text-stone-500 text-xs cursor-not-allowed"
            />
            <span className="text-[10px] text-stone-400 mt-1 block">
              Alamat email terdaftar tidak dapat diubah demi alasan keamanan identitas.
            </span>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={initialName}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {profileState?.errors?.name && (
              <p className="text-[11px] text-red-600 mt-1">{profileState.errors.name[0]}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isUpdatingProfile}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isUpdatingProfile ? "Menyimpan..." : "Simpan Perubahan Nama"}</span>
          </button>
        </form>
      </div>

      {/* Form Ubah Password */}
      <div className="bg-white rounded-3xl border border-stone-200/80 shadow-xs p-6">
        <div className="flex items-center gap-2 text-stone-800 font-bold text-sm mb-4">
          <KeyRound className="w-4 h-4 text-emerald-700" />
          <h3>Ubah Password Akun</h3>
        </div>

        {passwordState && !passwordState.success && passwordState.message && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{passwordState.message}</span>
          </div>
        )}

        {passwordState && passwordState.success && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
            <span>{passwordState.message}</span>
          </div>
        )}

        <form action={passwordAction} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Password Saat Ini
            </label>
            <input
              type="password"
              name="currentPassword"
              required
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Password Baru (Min. 10 karakter)
            </label>
            <input
              type="password"
              name="newPassword"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimal 10 karakter (huruf & angka)"
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-stone-600 uppercase tracking-wider mb-1">
              Ulangi Password Baru
            </label>
            <input
              type="password"
              name="confirmPassword"
              required
              placeholder="Ketik ulang password baru..."
              className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-stone-800 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            {passwordState?.errors?.confirmPassword && (
              <p className="text-[11px] text-red-600 mt-1">{passwordState.errors.confirmPassword[0]}</p>
            )}
          </div>

          {/* Indikator Real-time */}
          <div className="p-2.5 bg-stone-50 rounded-lg text-[10px] space-y-0.5 text-stone-500">
            <div className={hasMinLength ? "text-emerald-700 font-semibold" : ""}>
              {hasMinLength ? "✓" : "○"} Minimal 10 karakter
            </div>
            <div className={hasLetter ? "text-emerald-700 font-semibold" : ""}>
              {hasLetter ? "✓" : "○"} Mengandung huruf
            </div>
            <div className={hasNumber ? "text-emerald-700 font-semibold" : ""}>
              {hasNumber ? "✓" : "○"} Mengandung angka
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 disabled:bg-emerald-400 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>{isChangingPassword ? "Memperbarui Password..." : "Simpan Password Baru"}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
