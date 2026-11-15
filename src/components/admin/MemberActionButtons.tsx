"use client";

import { useState } from "react";
import { Unlock, UserCheck, UserX, AlertCircle } from "lucide-react";
import { resetUserLockoutAction, toggleUserStatusAction } from "@/actions/members";

interface MemberActionButtonsProps {
  userId: string;
  userName: string;
  isActive: boolean;
  isLocked: boolean;
  isAdmin: boolean;
}

export function MemberActionButtons({
  userId,
  userName,
  isActive,
  isLocked,
  isAdmin,
}: MemberActionButtonsProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUnlock = async () => {
    if (!confirm(`Buka kunci akun untuk "${userName}"? User akan dapat mencoba masuk kembali.`)) {
      return;
    }

    setIsPending(true);
    setError(null);
    const res = await resetUserLockoutAction(userId);
    setIsPending(false);
    if (!res.success) setError(res.message || "Gagal membuka kunci.");
  };

  const handleToggleStatus = async () => {
    const actionText = isActive ? "menonaktifkan" : "mengaktifkan";
    if (!confirm(`Yakin ingin ${actionText} akun "${userName}"?`)) {
      return;
    }

    setIsPending(true);
    setError(null);
    const res = await toggleUserStatusAction(userId);
    setIsPending(false);
    if (!res.success) setError(res.message || "Gagal mengubah status akun.");
  };

  if (isAdmin) {
    return <span className="text-[11px] text-stone-400 italic">Akun Utama</span>;
  }

  return (
    <div className="flex flex-col items-end gap-1">
      {error && (
        <div className="text-[10px] text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {isLocked && (
          <button
            type="button"
            onClick={handleUnlock}
            disabled={isPending}
            className="py-1 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
            title="Reset Kunci Akun"
          >
            <Unlock className="w-3.5 h-3.5" />
            <span>Buka Kunci</span>
          </button>
        )}

        <button
          type="button"
          onClick={handleToggleStatus}
          disabled={isPending}
          className={`py-1 px-2.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40 ${
            isActive
              ? "bg-red-50 hover:bg-red-100 text-red-700 border border-red-200"
              : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
          }`}
          title={isActive ? "Nonaktifkan Akun" : "Aktifkan Akun"}
        >
          {isActive ? (
            <>
              <UserX className="w-3.5 h-3.5" />
              <span>Nonaktifkan</span>
            </>
          ) : (
            <>
              <UserCheck className="w-3.5 h-3.5" />
              <span>Aktifkan</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
