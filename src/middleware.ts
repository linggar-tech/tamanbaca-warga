import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "tb_session_token";

/**
 * Memvalidasi apakah target host diizinkan untuk mutasi data (CSRF Protection).
 * Memeriksa:
 * 1. Host dari request saat ini.
 * 2. Nilai dari variabel lingkungan APP_URL / NEXT_PUBLIC_APP_URL.
 * 3. Domain deployment Vercel resmi proyek ini (VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL).
 */
function isAllowedDomain(targetHost: string, requestHost: string | null): boolean {
  const normalizedTarget = targetHost.toLowerCase();

  // 1. Cocokkan dengan Host dari header HTTP request saat ini
  if (requestHost && normalizedTarget === requestHost.toLowerCase()) {
    return true;
  }

  // 2. Cocokkan dengan domain resmi dari Environment Variable
  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (envAppUrl) {
    try {
      const parsedEnv = new URL(envAppUrl);
      if (normalizedTarget === parsedEnv.host.toLowerCase()) {
        return true;
      }
    } catch {
      // Abaikan jika envAppUrl bukan URL yang valid
    }
  }

  // 3. Domain deployment Vercel resmi milik proyek ini (VERCEL_URL / VERCEL_PROJECT_PRODUCTION_URL)
  const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelUrl && normalizedTarget === vercelUrl.toLowerCase()) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;

  // 1. Proteksi CSRF Menyeluruh untuk request mutasi (POST, PUT, DELETE, PATCH)
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    // a. Pengecekan Sec-Fetch-Site (Standar Fetch Metadata W3C)
    // Tolak request mutasi yang terdeteksi bersumber dari cross-site
    const secFetchSite = request.headers.get("sec-fetch-site");
    if (secFetchSite === "cross-site") {
      return new NextResponse(
        JSON.stringify({
          error: "Permintaan ditolak: Pelanggaran Kebijakan CSRF (Sec-Fetch-Site: cross-site).",
        }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    const origin = request.headers.get("origin");
    const referer = request.headers.get("referer");
    const host = request.headers.get("host");

    // b. Tolak jika Origin bernilai "null" (misal dari sandboxed iframe, file://, atau data: URI)
    if (origin === "null") {
      return new NextResponse(
        JSON.stringify({ error: "Permintaan ditolak: Nilai Origin tidak valid (null)." }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    // c. Tolak jika Origin dan Referer sama-sama tidak disertakan (Anti-Omission Bypass)
    if (!origin && !referer) {
      return new NextResponse(
        JSON.stringify({
          error: "Permintaan ditolak: Header Origin atau Referer wajib disertakan untuk metode mutasi.",
        }),
        { status: 403, headers: { "content-type": "application/json" } }
      );
    }

    // d. Validasi Origin (jika ada)
    if (origin) {
      let originUrl: URL;
      try {
        originUrl = new URL(origin);
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "Permintaan ditolak: Format URL Origin tidak valid." }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      if (!isAllowedDomain(originUrl.host, host)) {
        return new NextResponse(
          JSON.stringify({ error: "Permintaan ditolak: Pelanggaran Kebijakan CSRF Origin." }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
    }
    // e. Validasi Referer (fallback jika Origin tidak disertakan)
    else if (referer) {
      let refererUrl: URL;
      try {
        refererUrl = new URL(referer);
      } catch {
        return new NextResponse(
          JSON.stringify({ error: "Permintaan ditolak: Format URL Referer tidak valid." }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }

      if (!isAllowedDomain(refererUrl.host, host)) {
        return new NextResponse(
          JSON.stringify({ error: "Permintaan ditolak: Pelanggaran Kebijakan CSRF Referer." }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
    }
  }

  // 2. Proteksi Akses Rute Admin & Member (Level Perimeter Middleware)
  const isAdminRoute = pathname.startsWith("/admin");
  const isMemberRoute = pathname.startsWith("/member");

  // Jika mencoba akses rute terproteksi tanpa cookie sesi -> redirect ke login
  if ((isAdminRoute || isMemberRoute) && !sessionToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const response = NextResponse.next();

  // 3. Tambahan Security Headers di level respons middleware
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Permitted-Cross-Domain-Policies", "none");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  return response;
}

export const config = {
  matcher: [
    /*
     * Cocokkan semua path request kecuali untuk file statis Next.js & aset gambar
     */
    "/((?!_next/static|_next/image|favicon.ico|images|uploads).*)",
  ],
};
