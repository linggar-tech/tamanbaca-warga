import Link from "next/link";
import { BookOpen, LayoutDashboard, BookmarkCheck, Library, User, LogOut } from "lucide-react";
import { logoutAction } from "@/actions/auth";

interface MemberNavProps {
  currentPath?: string;
  userName: string;
}

export function MemberNav({ currentPath = "", userName }: MemberNavProps) {
  const navItems = [
    { label: "Dashboard Warga", href: "/member/dashboard", icon: LayoutDashboard },
    { label: "Pinjaman Saya", href: "/member/pinjaman", icon: BookmarkCheck },
    { label: "Profil Saya", href: "/member/profil", icon: User },
    { label: "Katalog Buku", href: "/katalog", icon: Library },
  ];

  return (
    <header className="border-b border-stone-200 bg-white sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/member/dashboard" className="flex items-center gap-2 font-bold text-emerald-800 text-base">
              <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                <BookOpen className="w-4 h-4" />
              </div>
              <span>Portal Warga</span>
            </Link>

            <nav className="hidden sm:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;
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
            <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-100/80 px-2.5 py-1 rounded-full border border-stone-200/60">
              <User className="w-3.5 h-3.5 text-emerald-700" />
              <span>
                <strong>{userName}</strong> (Anggota)
              </span>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 py-1.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-lg border border-red-200 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar</span>
              </button>
            </form>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex sm:hidden overflow-x-auto py-2 gap-1 border-t border-stone-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap ${
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
