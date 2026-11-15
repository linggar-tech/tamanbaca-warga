import Link from "next/link";
import { BookOpen } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-2xl font-bold text-emerald-800 hover:text-emerald-900 transition-colors"
        >
          <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl shadow-sm">
            <BookOpen className="w-7 h-7" />
          </div>
          <span>TamanBaca Warga</span>
        </Link>
        <p className="mt-2 text-sm text-stone-600">
          Membangun Budaya Literasi Warga yang Cerdas & Berdaya
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-md shadow-stone-200/50 rounded-2xl border border-stone-200/80 sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
