import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Memulai proses seeding database TamanBaca Warga...");

  // Keamanan: Password akun demo diambil secara ketat dari environment variable
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;
  const memberPassword = process.env.SEED_MEMBER_PASSWORD;

  if (!adminPassword || !memberPassword) {
    throw new Error(
      "❌ KEAMANAN: Variabel lingkungan SEED_ADMIN_PASSWORD dan SEED_MEMBER_PASSWORD wajib disetel sebelum menjalankan seed script."
    );
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@tamanbaca.id";
  const memberEmail = process.env.SEED_MEMBER_EMAIL || "warga@tamanbaca.id";

  const adminPasswordHash = await bcrypt.hash(adminPassword, 12);
  const memberPasswordHash = await bcrypt.hash(memberPassword, 12);

  // 1. Buat / Update Akun ADMIN
  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    create: {
      name: "Pengelola Taman Baca",
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Akun Admin berhasil disiapkan: ${adminUser.email}`);

  // 2. Buat / Update Akun MEMBER
  const memberUser = await prisma.user.upsert({
    where: { email: memberEmail },
    update: {
      passwordHash: memberPasswordHash,
      role: Role.MEMBER,
      isActive: true,
      failedLoginCount: 0,
      lockedUntil: null,
    },
    create: {
      name: "Budi Santoso",
      email: memberEmail,
      passwordHash: memberPasswordHash,
      role: Role.MEMBER,
      isActive: true,
    },
  });
  console.log(`✅ Akun Member berhasil disiapkan: ${memberUser.email}`);

  // 3. Buat Kategori Awal
  const categoriesData = [
    { name: "Teknologi & Cyber Security" },
    { name: "Sastra & Fiksi" },
    { name: "Sains & Alam" },
    { name: "Pengembangan Diri" },
    { name: "Sosial & Sejarah" },
  ];

  const createdCategories: Record<string, string> = {};

  for (const cat of categoriesData) {
    const category = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: { name: cat.name },
    });
    createdCategories[cat.name] = category.id;
  }
  console.log(`✅ ${categoriesData.length} Kategori buku berhasil disiapkan.`);

  // 4. Buat Buku Contoh dengan Gambar Sampul Bebas Lisensi (Unsplash)
  const booksData = [
    {
      title: "Prinsip Pertahanan Siber Modern",
      author: "Dr. Pratama Yudha",
      publisher: "Penerbit Informatika Merdeka",
      year: 2023,
      isbn: "978-602-001-011",
      stock: 4,
      categoryId: createdCategories["Teknologi & Cyber Security"],
      description: "Panduan komprehensif mengamankan sistem komputasi dan aplikasi web dari serangan siber modern.",
      coverUrl: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Laskar Pelangi",
      author: "Andrea Hirata",
      publisher: "Bentang Pustaka",
      year: 2005,
      isbn: "978-979-306-279",
      stock: 5,
      categoryId: createdCategories["Sastra & Fiksi"],
      description: "Kisah inspiratif sepuluh anak Belitung yang berjuang meraih mimpi dan pendidikan.",
      coverUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Atomic Habits: Perubahan Kecil yang Memberikan Hasil Luar Biasa",
      author: "James Clear",
      publisher: "Gramedia Pustaka Utama",
      year: 2019,
      isbn: "978-602-063-317",
      stock: 3,
      categoryId: createdCategories["Pengembangan Diri"],
      description: "Metode praktis membentuk kebiasaan baik dan menghilangkan kebiasaan buruk secara konsisten.",
      coverUrl: "https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Kosmos: Melacak Jejak Alam Semesta",
      author: "Carl Sagan",
      publisher: "Kepustakaan Populer Gramedia",
      year: 2017,
      isbn: "978-602-424-224",
      stock: 2,
      categoryId: createdCategories["Sains & Alam"],
      description: "Eksplorasi puitis tentang sains, evolusi kosmik, dan masa depan peradaban manusia.",
      coverUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80",
    },
    {
      title: "Nusantara: Sejarah Indonesia",
      author: "Bernard H.M. Vlekke",
      publisher: "Komunitas Bambu",
      year: 2008,
      isbn: "978-979-373-122",
      stock: 3,
      categoryId: createdCategories["Sosial & Sejarah"],
      description: "Tinjauan mendalam pembentukan bangsa dan kebudayaan di kepulauan Nusantara sejak masa kuno.",
      coverUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80",
    },
  ];

  for (const b of booksData) {
    if (b.categoryId) {
      await prisma.book.upsert({
        where: { isbn: b.isbn },
        update: { stock: b.stock, coverUrl: b.coverUrl },
        create: b,
      });
    }
  }
  console.log(`✅ ${booksData.length} Buku contoh berhasil disiapkan.`);

  // 5. Catat Audit Log Inisialisasi
  await prisma.auditLog.create({
    data: {
      userId: adminUser.id,
      action: "DATABASE_SEEDED",
      entity: "System",
      ipAddress: "127.0.0.1",
      details: "Inisialisasi data awal admin, member, kategori, dan buku demo.",
    },
  });

  console.log("✨ Seeding selesai secara aman dan sukses!");
}

main()
  .catch((e) => {
    console.error("Terjadi error pada seed database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
