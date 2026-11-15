"use client";

import { useState } from "react";
import { Check, X, Undo2, AlertCircle } from "lucide-react";
import { approveLoanAction, rejectLoanAction, returnLoanAction } from "@/actions/loans";

interface LoanActionButtonsProps {
  loanId: string;
  status: string;
  bookTitle: string;
  userName: string;
  isLate?: boolean;
  estimatedFine?: number;
}

export function LoanActionButtons({
  loanId,
  status,
  bookTitle,
  userName,
  isLate = false,
  estimatedFine = 0,
}: LoanActionButtonsProps) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async () => {
    if (!confirm(`Setujui peminjaman buku "${bookTitle}" untuk ${userName}?\nStok buku akan otomatis berkurang 1.`)) {
      return;
    }
    setIsPending(true);
    setError(null);
    const res = await approveLoanAction(loanId);
    setIsPending(false);
    if (!res.success) setError(res.message || "Gagal menyetujui peminjaman.");
  };

  const handleReject = async () => {
    const reason = prompt(`Tolak peminjaman buku "${bookTitle}" untuk ${userName}?\nMasukkan alasan singkat:`);
    if (reason === null) return;

    setIsPending(true);
    setError(null);
    const res = await rejectLoanAction(loanId, reason || undefined);
    setIsPending(false);
    if (!res.success) setError(res.message || "Gagal menolak peminjaman.");
  };

  const handleReturn = async () => {
    let confirmMsg = `Catat pengembalian buku "${bookTitle}" dari ${userName}?\nStok buku akan bertambah 1.`;
    if (isLate && estimatedFine > 0) {
      confirmMsg += `\n\nPERINGATAN: Pengembalian terlambat!\nEstimasi denda: Rp${estimatedFine.toLocaleString("id-ID")}`;
    }

    if (!confirm(confirmMsg)) return;

    setIsPending(true);
    setError(null);
    const res = await returnLoanAction(loanId);
    setIsPending(false);
    if (!res.success) setError(res.message || "Gagal mencatat pengembalian.");
  };

  return (
    <div className="flex flex-col items-end gap-1.5">
      {error && (
        <div className="p-1.5 bg-red-50 text-red-700 text-[10px] rounded flex items-center gap-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        {status === "PENDING" && (
          <>
            <button
              type="button"
              onClick={handleApprove}
              disabled={isPending}
              className="py-1 px-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
              title="Setujui Peminjaman & Kurangi Stok"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Setujui</span>
            </button>
            <button
              type="button"
              onClick={handleReject}
              disabled={isPending}
              className="py-1 px-2.5 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
              title="Tolak Pengajuan"
            >
              <X className="w-3.5 h-3.5" />
              <span>Tolak</span>
            </button>
          </>
        )}

        {status === "BORROWED" && (
          <button
            type="button"
            onClick={handleReturn}
            disabled={isPending}
            className="py-1 px-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-40"
            title="Catat Buku Kembali & Hitung Denda"
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Catat Kembali</span>
          </button>
        )}
      </div>
    </div>
  );
}
