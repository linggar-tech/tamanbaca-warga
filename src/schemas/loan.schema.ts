import { z } from "zod";

export const requestLoanSchema = z.object({
  bookId: z.string().trim().min(1, "ID buku tidak valid"),
});

export const loanActionSchema = z.object({
  loanId: z.string().trim().min(1, "ID peminjaman tidak valid"),
});

export const rejectLoanSchema = z.object({
  loanId: z.string().trim().min(1, "ID peminjaman tidak valid"),
  reason: z.string().trim().max(200, "Alasan penolakan maksimal 200 karakter").optional(),
});
