import Link from "next/link";
import {
  BookOpen,
  LayoutDashboard,
  Folders,
  BookCopy,
  Users,
  CalendarCheck2,
  FileBarChart2,
  ShieldAlert,
  LogOut,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface AdminNavProps {
  currentPath?: string;
  adminName: string;
}

export function AdminNav({ currentPath = "", adminName }: AdminNavProps) {
  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "Kategori Buku", href: "/admin/kategori", icon: Folders },
    { label: "Koleksi Buku", href: "/admin/buku", icon: BookCopy },
    { label: "Peminjaman", href: "/admin/peminjaman", icon: CalendarCheck2 },
    { label: "Anggota Warga", href: "/admin/anggota", icon: Users },
    { label: "Laporan", href: "/admin/laporan", icon: FileBarChart2 },
    { label: "Audit Log", href: "/admin/audit-log", icon: ShieldAlert },
  ];

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-emerald-800 text-base">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
              <span>Panel Admin</span>
            </Link>

            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-emerald-50 text-emerald-800 font-bold"
                        : "text-stone-600 hover:text-emerald-800 hover:bg-stone-50"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-stone-500 hidden sm:inline">
              Pengelola: <strong>{adminName}</strong>
            </span>
            <Link
              href="/katalog"
              target="_blank"
              className="text-xs font-semibold text-emerald-700 hover:underline hidden md:inline"
            >
              Lihat Web Publik ↗
            </Link>
            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 border-t border-stone-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-bold"
                    : "text-stone-600 hover:bg-stone-50"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
