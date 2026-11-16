# 📚 TamanBaca Warga - Sistem Informasi Manajemen Taman Bacaan Masyarakat

Aplikasi web pengelolaan taman bacaan masyarakat yang dirancang dengan arsitektur **Secure Software Development Lifecycle (SSDLC)** dan beroperasi secara penuh (*production-ready*). Aplikasi ini dibangun untuk memenuhi tugas besar mata kuliah **Cyber Security**, menggabungkan kemudahan akses literasi warga dengan kontrol keamanan informasi berlapis (*Defense-in-Depth*).

---

## 🌐 URL Aplikasi Publik (Live Deployment)

* **Production URL**: `https://tamanbaca-warga-yct9.vercel.app/`
* **Protokol**: HTTPS dengan sertifikat SSL/TLS otomatis dari Vercel
* **Database Provider**: Serverless PostgreSQL Neon (Region: `aws-ap-southeast-1` Singapore)

---

## 🛡️ Fitur Utama Aplikasi

### 1. Pengunjung Publik
* **Landing Page Interaktif**: Banner hero literasi, metrik statistik live perpustakaan, cuplikan 4 buku terbaru, serta pilar keamanan siber.
* **Katalog Koleksi Buku**: Penelusuran buku dengan pencarian judul/pengarang/penerbit, filter kategori dinamis, dan navigasi paginasi.
* **Detail Buku**: Informasi lengkap metadata buku (judul, pengarang, penerbit, tahun, ISBN, sinopsis, dan status ketersediaan stok fisik).
* **Autentikasi Aman**: Pendaftaran akun anggota mandiri dan form masuk akun.

### 2. Anggota Warga (MEMBER)
* **Dashboard Warga**: Pemantauan kuota aktif (maksimal 3 peminjaman buku aktif), daftar pinjaman berjalan, dan peringatan tanggal jatuh tempo.
* **Sirkulasi Mandiri**: Mengajukan pinjaman buku dari katalog dan membatalkan pengajuan yang masih berstatus `PENDING`.
* **Riwayat Peminjaman Pribadi**: Melihat daftar riwayat seluruh status peminjaman (`PENDING`, `BORROWED`, `RETURNED`, `REJECTED`, `CANCELLED`) dan denda yang pernah dikenakan.
* **Keamanan Profil**: Mengubah nama profil pribadi dan mengganti kata sandi secara mandiri dengan verifikasi kata sandi lama (dilindungi proteksi Anti-IDOR).

### 3. Administrator / Pengelola (ADMIN)
* **Dashboard Statistik & Visualisasi Grafik**:
  * Metrik ringkasan: Total koleksi buku, total anggota, pinjaman aktif, dan pinjaman terlambat.
  * Grafik tren peminjaman bulanan (Recharts Area Chart).
  * Grafik 5 buku paling sering dipinjam warga (Recharts Bar Chart).
  * Cuplikan aktivitas terkini dari log audit.
* **Manajemen Koleksi Buku**: Tambah, edit, dan hapus buku dengan upload gambar sampul aman (validasi *Magic Bytes* & batas ukuran 1 MB).
* **Manajemen Kategori Buku**: Tambah, ubah nama, dan hapus kategori (dengan proteksi integritas relasi buku).
* **Sirkulasi Peminjaman**: Menyetujui pengajuan pinjaman (stok berkurang atomik), menolak pengajuan, dan mencatat pengembalian buku (stok bertambah atomik dan denda terhitung otomatis jika terlambat).
* **Manajemen Anggota Warga**: Melihat seluruh daftar warga, mengaktifkan/menonaktifkan akun, dan membuka status kunci akun yang terblokir (*Reset Brute-force Lockout*).
* **Rekap Laporan & Ekspor**:
  * Filter sirkulasi berdasarkan rentang tanggal dan status transaksi.
  * Ekspor ke **CSV** yang dilengkapi sanitasi Anti-CSV Injection.
  * Ekspor ke **PDF** resmi berorientasi lanskap menggunakan `jspdf` dan `jspdf-autotable`.
* **Log Aktivitas Sistem (Audit Trail)**: Melihat catatan forensik sistem lengkap (waktu WIB, aksi, pengguna, alamat IP, dan deskripsi detail).

---

## 🔒 Postur & Arsitektur Keamanan Siber (Defense-in-Depth)

Aplikasi ini mengimplementasikan 13 standar keamanan wajib:

1. **Password Hashing Berkekuatan Tinggi**: Kata sandi di-hash menggunakan `bcryptjs` dengan **salt cost 12**. Kebijakan password menolak kata sandi lemah (wajib minimal 10 karakter serta mengombinasikan huruf dan angka).
2. **Validasi Input Menyeluruh (Server-Side Zod)**: Semua input data formulir, parameter query URL, dan ID diuji validasinya di sisi server menggunakan skema Zod. Bebas dari SQL Injection karena menggunakan Prisma ORM dengan *parameterized queries* terisolasi.
3. **Pencegahan Cross-Site Scripting (XSS)**: Menggunakan encoding otomatis React JSX (tanpa `dangerouslySetInnerHTML`) dan diperkuat oleh Content-Security-Policy (CSP) ketat di level HTTP header.
4. **Manajemen Sesi Database & Cookie Aman**:
   * Token sesi disimpan di tabel database `Session` (dapat dicabut seketika saat logout/nonaktif).
   * Atribut cookie: `HttpOnly` (kebal pencurian JavaScript), `SameSite=Lax` (mitigasi CSRF), dan `Secure` (hanya via HTTPS di produksi).
   * Pesan kegagalan login bersifat **generik** (*"Email atau password yang Anda masukkan salah"*) guna mencegah *User Enumeration*.
5. **Mitigasi Cross-Site Request Forgery (CSRF)**: Verifikasi header `Origin` dan `Referer` di gerbang middleware untuk seluruh request mutasi data (`POST`, `PUT`, `DELETE`, `PATCH`).
6. **Kontrol Akses Berbasis Peran (RBAC) & Anti-IDOR**:
   * Hak akses diverifikasi ganda: di gerbang perimeter `middleware.ts` dan diverifikasi ulang di dalam setiap Server Action (`requireAdmin()` dan `requireAuth()`).
   * **Pencegahan Insecure Direct Object References (Anti-IDOR)**: Setiap query data riwayat, pembatalan, maupun ubah profil member wajib menyertakan filter `userId: session.user.id` yang bersumber dari sesi server, bukan dari input user.
7. **Perlindungan Brute-Force & Rate Limiting**:
   * Rate limiting pada percobaan login (maks. 5 kali/menit per IP) dan endpoint ekspor laporan (maks. 10 kali/menit).
   * Akun otomatis dikunci sementara selama **15 menit** setelah 5 kali berturut-turut salah memasukkan kata sandi.
8. **HTTP Security Headers Lengkap**:
   * `Content-Security-Policy` (CSP non-breaking)
   * `Strict-Transport-Security` (HSTS: `max-age=63072000; includeSubDomains; preload`)
   * `X-Frame-Options: DENY` (Anti-Clickjacking)
   * `X-Content-Type-Options: nosniff` (Anti-MIME Sniffing)
   * `X-Permitted-Cross-Domain-Policies: none`
   * `Referrer-Policy: strict-origin-when-cross-origin`
   * `Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()`
   * `poweredByHeader: false` (Menyembunyikan informasi teknologi server)
9. **Validasi File Upload Sampul Aman**:
   * Batasan ukuran maksimal **1 MB**.
   * Whitelist format ketat: hanya `.jpg`, `.jpeg`, `.png`, dan `.webp`.
   * **Magic Bytes Verification (File Signature)**: Memeriksa header biner asli file di server untuk mencegah file skrip berbahaya disamarkan dengan ekstensi gambar.
   * Nama file diacak secara kriptografis menggunakan `crypto.randomUUID()` untuk mencegah *Path Traversal* dan *Remote Code Execution*.
10. **Sanitasi Anti-CSV / Formula Injection**: Seluruh data sel pada ekspor CSV yang diawali karakter sensitif formula (`=`, `+`, `-`, `@`, `\t`, `\r`) secara otomatis diberi prefix tanda kutip tunggal (`'`) dan di-escape tanda kutip ganda, serta menggunakan UTF-8 BOM (`\uFEFF`).
11. **Pencatatan Audit Trail Forensik (AuditLog)**: Seluruh peristiwa kritis (pendaftaran, login sukses, login gagal, penguncian akun, mutasi buku/kategori, persetujuan peminjaman, dan ekspor) dicatat otomatis dengan timestamp dan alamat IP klien.
12. **Zero Hardcoded Secret**: Kredensial, kunci sesi, dan kata sandi demo disuplai secara mutlak melalui environment variable.
13. **Generic Error Boundaries**: Galat runtime internal ditangani oleh `error.tsx` dan `global-error.tsx` tanpa pernah menampilkan stack trace, query database, atau path server ke pengguna publik.

---

## 💻 Tech Stack

* **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Actions, TypeScript)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/) (Tema hangat hijau sage & krem)
* **Database & ORM**: PostgreSQL ([Neon Serverless](https://neon.tech/)) + [Prisma ORM](https://www.prisma.io/)
* **Validasi Skema**: [Zod](https://zod.dev/)
* **Kriptografi**: [bcryptjs](https://www.npmjs.com/package/bcryptjs)
* **Visualisasi & Ekspor**: [Recharts](https://recharts.org/), [jsPDF](https://github.com/parallax/jsPDF), [jspdf-autotable](https://github.com/simonbengtsson/jsPDF-AutoTable)
* **Iconography**: [Lucide React](https://lucide.dev/)
* **Deployment Target**: [Vercel](https://vercel.com/)

---

## ⚙️ Konfigurasi Environment Variables

Aplikasi membaca seluruh konfigurasi sensitif dari variabel lingkungan. Sediakan file `.env` di root direktori dengan menyalin dari template `.env.example`:

| Nama Variabel | Wajib | Keterangan / Fungsi | Contoh Nilai (Bukan Rahasia) |
|---|:---:|---|---|
| `DATABASE_URL` | Ya | URL koneksi PostgreSQL ber-pooling (Neon SSL mode) | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` |
| `DIRECT_URL` | Ya | URL koneksi langsung PostgreSQL tanpa pooler (untuk sinkronisasi skema Prisma db push / CLI) | `postgresql://user:pass@ep-xyz.aws.neon.tech/neondb?sslmode=require` |
| `SEED_ADMIN_EMAIL` | Ya | Alamat email akun Administrator demo awal | `admin@tamanbaca.id` |
| `SEED_ADMIN_PASSWORD` | Ya | Kata sandi kuat akun Admin demo (min. 10 karakter, huruf + angka) | `<masukkan-password-admin-kuat>` |
| `SEED_MEMBER_EMAIL` | Ya | Alamat email akun Member demo awal | `warga@tamanbaca.id` |
| `SEED_MEMBER_PASSWORD` | Ya | Kata sandi kuat akun Member demo (min. 10 karakter, huruf + angka) | `<masukkan-password-member-kuat>` |
| `FINE_PER_DAY` | Ya | Besaran nominal tarif denda per hari keterlambatan (Rupiah) | `1000` |
| `NEXT_PUBLIC_APP_URL` | Ya | URL dasar aplikasi untuk validasi header CSRF Origin | `http://localhost:3000` (atau URL Vercel di prod) |
| `NODE_ENV` | Ya | Lingkungan aplikasi runtime | `development` / `production` |

> ⚠️ **Catatan Keamanan**: File `.env` dan `.env.local` telah terdaftar di `.gitignore` dan tidak boleh diunggah ke repositori publik Git.

---

## 🚀 Panduan Instalasi & Menjalankan Lokal

### 1. Clone Repositori & Pasang Dependensi
```bash
git clone <url-repo-anda>
cd "Project Cyber Security"
npm install
```

### 2. Salin Konfigurasi Environment
```bash
cp .env.example .env
```
Sesuaikan nilai `DATABASE_URL`, `DIRECT_URL`, dan password demo di dalam `.env`.

### 3. Sinkronisasi Skema Database & Seeding
Proyek ini menggunakan `prisma db push` untuk menyinkronkan definisi skema Prisma secara langsung ke serverless PostgreSQL Neon tanpa memerlukan histori berkas migrasi lokal:
```bash
# Sinkronkan skema tabel ke PostgreSQL Neon
npx prisma db push

# Jalankan seed data percontohan (Admin, Member, Kategori, Koleksi Buku Awal)
npm run seed
```

> 💡 **Catatan Peningkatan**: Jika di kemudian hari dibutuhkan pelacakan riwayat migrasi bertahap per-versi (*formal migration history tracking*), Anda dapat beralih ke alur `npx prisma migrate dev` dengan membuat baseline migrasi awal.

### 4. Jalankan Server Pengembangan
```bash
npm run dev
```
Buka peramban Anda di `http://localhost:3000`.

### Kredensial Demo Awal:
* **Admin**: `admin@tamanbaca.id` / Password: Nilai dari `SEED_ADMIN_PASSWORD`
* **Member**: `warga@tamanbaca.id` / Password: Nilai dari `SEED_MEMBER_PASSWORD`

---

## ☁️ Panduan Deployment ke Vercel (Produksi)

1. **Push Repositori ke GitHub / GitLab**:
   ```bash
   git add .
   git commit -m "feat: initial production-ready commit"
   git branch -M main
   git remote add origin <url-repo-github-anda>
   git push -u origin main
   ```
2. **Impor Proyek ke Dashboard Vercel**:
   * Buka [vercel.com](https://vercel.com/) $\rightarrow$ **Add New** $\rightarrow$ **Project**.
   * Pilih repositori GitHub proyek ini.
3. **Isi Environment Variables di Vercel**:
   Masuk ke bagian **Environment Variables** pada form deployment Vercel dan tambahkan seluruh variabel:
   * `DATABASE_URL` (connection string pooled Neon)
   * `DIRECT_URL` (connection string unpooled/direct Neon)
   * `SEED_ADMIN_EMAIL` & `SEED_ADMIN_PASSWORD`
   * `SEED_MEMBER_EMAIL` & `SEED_MEMBER_PASSWORD`
   * `FINE_PER_DAY`
   * `NEXT_PUBLIC_APP_URL` (setel ke domain Vercel Anda, contoh `https://tamanbaca-warga.vercel.app`)
   * `NODE_ENV` = `production`
4. **Deploy**:
   * Klik tombol **Deploy**. Vercel akan otomatis menjalankan `prisma generate` dan `next build`.
5. **Menjalankan Seeding di Produksi**:
   Jalankan script seed sekali dari komputer lokal Anda yang mengarah ke database produksi:
   ```bash
   npm run seed
   ```

---

## 🤖 Ringkasan Penggunaan AI Agent

Aplikasi ini dikembangkan melalui kolaborasi terstruktur bersama **AI Agent (Google Deepmind Antigravity)** dengan pendekatan bertahap (*phase-by-phase execution*):
1. **Fase 1**: Perancangan skema relasional Prisma, inisialisasi arsitektur Next.js 15, modul hashing bcrypt cost 12, rate limit in-memory, serta database session.
2. **Fase 2**: Integrasi resmi Neon PostgreSQL CLI/MCP di region Singapore, implementasi RBAC berlapis (*defense-in-depth*), CRUD buku & kategori khusus Admin, validasi file upload sampul berbasis *Magic Bytes*, dan katalog buku publik terfilter Zod.
3. **Fase 3**: Alur sirkulasi peminjaman dengan kuota 3 buku aktif, transaksi database atomik (`prisma.$transaction`) untuk mutasi stok tanpa minus/race condition, mitigasi IDOR (*session-bound query*), dan perhitungan denda otomatis.
4. **Fase 4**: Visualisasi analitik data Recharts, rekap laporan sirkulasi terfilter, generator PDF resmi jsPDF-autotable, dan utilitas ekspor CSV dengan proteksi *Formula Injection*.
5. **Fase 5 & Seterusnya**: Penguatan header CSP & CSRF Origin, penambahan generic error boundaries, halaman Audit Log dan manajemen anggota terintegrasi, serta audit menyeluruh terhadap potensi celah keamanan aplikasi.

---

## 🧪 Ringkasan Hasil Self-Testing Keamanan

Berikut adalah tabel hasil pengujian mandiri (*Security Self-Assessment*) terhadap 11 skenario keamanan siber:

| No | Skenario Pengujian Keamanan | Metode Uji | Ekspektasi Pertahanan Sistem | Status Hasil Pengujian | Catatan Pengujian |
|:---:|---|---|---|:---:|---|
| **1** | **SQL Injection (SQLi)** | Form pencarian katalog & parameter URL `?q=' OR 1=1 --` | Diperlakukan sebagai teks literal murni, Prisma memblokir eksekusi SQL liar, tidak ada error Postgres | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **2** | **Cross-Site Scripting (XSS)** | Injeksi tag `<script>` & payload `<img>` pada URL dan profil | Teks di-escape otomatis oleh React DOM, inline script diblokir CSP, tidak ada popup `alert()` | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **3** | **Insecure Direct Object References (IDOR)** | Percobaan akses/pembatalan ID peminjaman milik user lain via request tampering | Server menyaring secara ketat via `userId: session.user.id`, aksi ditolak (404/Forbidden) | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **4** | **Bypass Hak Akses Admin oleh Member** | Member atau publik mengakses `/admin/*` atau endpoint `/api/admin/export/*` | Dicegat oleh middleware dan Server Action (`requireAdmin()`), redirect ke login atau HTTP 403 | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **5** | **Mass Assignment Role saat Registrasi** | Mengirimkan payload POST form registrasi dengan parameter `role=ADMIN` | Skema Zod mengabaikan role, server action memaksa `Role.MEMBER`, akun tetap berstatus MEMBER | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **6** | **Enforcement Password Lemah** | Mendaftarkan akun dengan password pendek (< 10 karakter) atau tanpa angka | Ditutupi indikator form dan ditolak oleh Zod di server dengan pesan instruksi keamanan | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **7** | **Brute-Force & Account Lockout** | Memasukkan password salah 5 kali berturut-turut pada akun yang sama | Akun otomatis terkunci selama 15 menit, aksi `ACCOUNT_LOCKED` terekam di AuditLog | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **8** | **Pencurian Sesi & Logout** | Membaca `document.cookie` di browser DevTools dan menekan tombol logout | Cookie ber-flag `HttpOnly` (tidak terbaca JS), token terhapus dari tabel DB saat logout | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **9** | **Upload File Berbahaya (Content Spoofing)** | Mengunggah file script berbahaya yang dinamai `.jpg` atau file berukuran > 1 MB | Ditolak oleh server lewat pengecekan Magic Bytes dan batas ukuran, file sah diacak UUID | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **10** | **CSV Injection & Git Secrets Leak** | Input profil berawalan `=cmd\|...` diekspor ke CSV, serta audit `git log` | Sel CSV otomatis disanitasi prefix `'`, file `.env` diabaikan oleh `.gitignore` tanpa kebocoran secret | `[LULUS / GAGAL]` | *[Isi catatan hasil uji mandiri Anda]* |
| **11** | **Audit HTTP Security Headers (SecurityHeaders.com)** | Pemindaian online scanner publik: [Hasil Scan SecurityHeaders.com](https://securityheaders.com/?q=https%3A%2F%2Ftamanbaca-warga-yct9.vercel.app%2F&followRedirects=on) | Semua header keamanan esensial (HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) aktif, X-Powered-By disembunyikan | `LULUS (Grade A+)` | Terverifikasi publik di SecurityHeaders.com dengan nilai kepatuhan Grade A+ |

---

## 🎨 Atribusi Aset & Lisensi Gambar

Semua gambar ilustrasi dan foto sampul buku yang digunakan dalam aplikasi ini bersumber dari koleksi domain publik berlisensi bebas dari [Unsplash](https://unsplash.com/license):
* **Ilustrasi Teknologi & Siber**: Foto oleh *Markus Spiske* via Unsplash.
* **Ilustrasi Sastra & Novel**: Foto oleh *Tom Hermans* & *Clay Banks* via Unsplash.
* **Ilustrasi Buku & Pendidikan**: Foto oleh *Kimberly Farmer* & *Susan Q Yin* via Unsplash.
* **Ikon Antarmuka**: [Lucide Icons](https://lucide.dev/) (Lisensi MIT).

---

## 📄 Lisensi Proyek

Proyek ini dikembangkan di bawah lisensi terbuka untuk keperluan pendidikan dan akademik mata kuliah **Cyber Security**.
