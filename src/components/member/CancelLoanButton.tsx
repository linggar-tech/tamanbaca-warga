"use client";

import { useState } from "react";
import { XCircle, AlertCircle } from "lucide-react";
import { cancelLoanAction } from "@/actions/loans";

export function CancelLoanButton({ loanId, bookTitle }: { loanId: string; bookTitle: string }) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!confirm(`Batalkan pengajuan peminjaman untuk buku "${bookTitle}"?`)) {
      return;
    }

    setIsPending(true);
    setError(null);

    const result = await cancelLoanAction(loanId);
    setIsPending(false);

    if (!result.success) {
      setError(result.message || "Gagal membatalkan pengajuan.");
    }
  };

  return (
    <div>
      {error && (
        <div className="mb-2 p-2 rounded bg-red-50 text-red-700 text-[11px] flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <button
        type="button"
        onClick={handleCancel}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-40"
      >
        <XCircle className="w-3.5 h-3.5" />
        <span>{isPending ? "Membatalkan..." : "Batalkan Pengajuan"}</span>
      </button>
    </div>
  );
}
