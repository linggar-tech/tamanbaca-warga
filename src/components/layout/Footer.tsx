import Link from "next/link";
import { BookOpen, ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-stone-200 bg-stone-50/60 mt-auto text-stone-600 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 font-bold text-emerald-800 text-base mb-2">
              <div className="p-1 bg-emerald-100 text-emerald-800 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
              <span>TamanBaca Warga</span>
            </div>
            <p className="text-stone-500 leading-relaxed max-w-sm">
              Sistem informasi perpustakaan taman bacaan masyarakat. Dirancang untuk transparansi peminjaman, pengelolaan buku yang tertib, dan keamanan data warga.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-stone-800 mb-2.5">Tautan Navigasi</h4>
            <ul className="space-y-1.5 text-stone-500">
              <li>
                <Link href="/" className="hover:text-emerald-700 transition-colors">
                  Halaman Utama
                </Link>
              </li>
              <li>
                <Link href="/katalog" className="hover:text-emerald-700 transition-colors">
                  Katalog Koleksi Buku
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-emerald-700 transition-colors">
                  Pendaftaran Anggota
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-emerald-700 transition-colors">
                  Masuk Akun
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-stone-800 mb-2.5 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span>Standar Keamanan Siber</span>
            </h4>
            <p className="text-stone-500 leading-relaxed">
              Menerapkan prinsip SSDLC: Enkripsi Bcrypt (cost 12), Cookie HttpOnly/SameSite=Lax, Sanitasi Input Zod, Pembatasan Brute-Force, dan Magic-byte Image Upload Verification.
            </p>
            <p className="text-stone-400 mt-2 text-[11px]">
              Ilustrasi sampul berlisensi bebas dari Unsplash (Andrea Hirata, Carl Sagan, James Clear, & Koleksi Terbuka).
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-200/80 text-center text-stone-400 text-[11px]">
          © {new Date().getFullYear()} TamanBaca Warga. Proyek Tugas Besar Cyber Security & Aplikasi Berdaya.
        </div>
      </div>
    </footer>
  );
}
