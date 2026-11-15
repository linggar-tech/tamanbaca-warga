import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TamanBaca Warga - Sistem Pengelolaan Taman Baca Masyarakat",
  description: "Aplikasi pengelolaan taman baca masyarakat yang aman, terbuka, dan inklusif.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-[#FDFBF7] text-[#292524] antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
