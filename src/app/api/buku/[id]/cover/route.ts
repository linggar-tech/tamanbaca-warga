import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import fs from "fs/promises";
import path from "path";

/**
 * Validasi Magic Bytes (File Signature) biner di sisi server.
 * Memastikan file benar-benar merupakan gambar berformat JPEG, PNG, atau WEBP.
 * Menolak format file yang dapat dieksekusi atau disusupi script (seperti SVG).
 */
function detectImageType(buffer: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (buffer.length < 12) return null;

  // JPEG / JPG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }

  // WEBP: 'RIFF'....'WEBP' (Bytes 0-3: 52 49 46 46, Bytes 8-11: 57 45 42 50)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }

  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return new NextResponse("ID buku tidak valid", { status: 400 });
    }

    // Ambil data coverUrl secara spesifik (terisolasi dari query data buku lainnya)
    const book = await prisma.book.findUnique({
      where: { id },
      select: { coverUrl: true },
    });

    if (!book || !book.coverUrl) {
      return new NextResponse("Sampul buku tidak ditemukan", { status: 404 });
    }

    const { coverUrl } = book;
    let buffer: Buffer;

    // Skenario 1: Disimpan sebagai Base64 Data URI di database (Serverless Vercel)
    if (coverUrl.startsWith("data:")) {
      const commaIndex = coverUrl.indexOf(",");
      if (commaIndex === -1) {
        return new NextResponse("Format gambar data URI rusak", { status: 400 });
      }
      const base64Data = coverUrl.slice(commaIndex + 1);
      buffer = Buffer.from(base64Data, "base64");
    }
    // Skenario 2: Disimpan di filesystem lokal (/uploads/covers/...)
    else if (coverUrl.startsWith("/uploads/covers/")) {
      try {
        const filePath = path.join(process.cwd(), "public", coverUrl);
        buffer = await fs.readFile(filePath);
      } catch {
        return new NextResponse("File fisik sampul tidak ditemukan di disk", { status: 404 });
      }
    }
    // Skenario 3: External URL (contoh: Unsplash / OpenLibrary dari seed awal)
    else if (coverUrl.startsWith("http://") || coverUrl.startsWith("https://")) {
      return NextResponse.redirect(coverUrl, 307);
    } else {
      return new NextResponse("Skema penyimpanan sampul tidak didukung", { status: 400 });
    }

    // Deteksi tipe konten murni dari Magic Bytes
    const contentType = detectImageType(buffer);
    if (!contentType) {
      return new NextResponse("Format file gambar tidak valid atau tidak diizinkan", {
        status: 415,
      });
    }

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": buffer.length.toString(),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    return new NextResponse("Terjadi kesalahan internal server saat memuat sampul", {
      status: 500,
    });
  }
}
