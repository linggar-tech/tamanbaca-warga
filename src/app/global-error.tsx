"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[FATAL GLOBAL ERROR]:", error.message);
  }, [error]);

  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FDFBF7] text-[#292524] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h1 className="text-2xl font-bold text-stone-800">
          Terjadi Gangguan Internal Server
        </h1>
        <p className="mt-2 text-stone-600 text-sm max-w-md">
          Sistem mendeteksi galat fatal. Mohon muat ulang peramban Anda.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="mt-6 py-2 px-5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold cursor-pointer"
        >
          Muat Ulang
        </button>
      </body>
    </html>
  );
}
