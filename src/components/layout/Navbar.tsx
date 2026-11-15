import Link from "next/link";
import { BookOpen, User, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export async function Navbar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur-md sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2.5 font-bold text-emerald-800 text-lg group">
            <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-xl group-hover:bg-emerald-200 transition-colors">
              <BookOpen className="w-5 h-5" />
            </div>
            <span className="tracking-tight">TamanBaca Warga</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600">
            <Link href="/" className="hover:text-emerald-800 transition-colors">
              Beranda
            </Link>
            <Link href="/katalog" className="hover:text-emerald-800 transition-colors">
              Katalog Buku
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-stone-600 bg-stone-100/80 px-3 py-1.5 rounded-full border border-stone-200/60">
                {user.role === "ADMIN" ? (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <User className="w-3.5 h-3.5 text-stone-600" />
                )}
                <span>
                  <strong>{user.name}</strong> ({user.role})
                </span>
              </div>
              <Link
                href={user.role === "ADMIN" ? "/admin/dashboard" : "/member/dashboard"}
                className="py-2 px-4 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                Panel {user.role === "ADMIN" ? "Pengelola" : "Warga"}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="py-2 px-3.5 text-stone-700 hover:text-emerald-800 text-xs font-semibold transition-colors"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                className="py-2 px-3.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all"
              >
                Daftar Warga
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
