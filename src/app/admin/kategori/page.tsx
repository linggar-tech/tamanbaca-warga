import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { AdminNav } from "@/components/layout/AdminNav";
import { CategoryManager } from "@/components/admin/CategoryManager";
import { Folders } from "lucide-react";

export default async function AdminCategoriesPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { books: true },
      },
    },
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <AdminNav currentPath="/admin/kategori" adminName={user.name} />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
              <Folders className="w-5 h-5" />
              <h1>Manajemen Kategori Buku</h1>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Atur pengelompokan buku untuk mempermudah pencarian warga di katalog.
            </p>
          </div>
        </div>

        <CategoryManager categories={categories} />
      </main>
    </div>
  );
}
