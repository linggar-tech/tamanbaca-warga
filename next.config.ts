import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV === "development";

// Kebijakan Keamanan Header HTTP (Security Headers)
// Mencegah Clickjacking, MIME-sniffing, XSS, dan kebocoran referrer
const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY", // Mencegah framing halaman aplikasi dari situs lain (anti-Clickjacking)
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff", // Mencegah browser menebak MIME type selain yang dideklarasikan
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      isDev
        ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
        : "script-src 'self' 'unsafe-inline'", // unsafe-eval dinonaktifkan di production
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' blob: https://images.unsplash.com https://covers.openlibrary.org", // data: dihapus karena gambar disajikan via route /api/buku/[id]/cover
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // Menghilangkan header 'X-Powered-By: Next.js' agar tidak membocorkan teknologi server
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "covers.openlibrary.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
