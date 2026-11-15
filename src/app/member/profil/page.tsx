import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { MemberNav } from "@/components/layout/MemberNav";
import { ProfileForm } from "@/components/member/ProfileForm";
import { UserCheck } from "lucide-react";

export default async function MemberProfilePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });

  if (!dbUser) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <MemberNav currentPath="/member/profil" userName={dbUser.name} />

      <main className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1">
        <div className="mb-6">
          <div className="flex items-center gap-2 text-emerald-800 font-bold text-xl">
            <UserCheck className="w-5 h-5" />
            <h1>Pengaturan Profil & Keamanan Akun</h1>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Perbarui nama lengkap dan kata sandi Anda secara mandiri (Poin Keamanan 1 & 6).
          </p>
        </div>

        <ProfileForm initialName={dbUser.name} email={dbUser.email} />
      </main>
    </div>
  );
}
