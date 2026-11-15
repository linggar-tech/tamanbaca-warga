import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

// Maksimal 1 MB (1.048.576 bytes) sesuai standar keamanan Poin 9
export const MAX_FILE_SIZE = 1 * 1024 * 1024;

// Whitelist tipe MIME dan ekstensi yang diizinkan
export const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

export type UploadResult = {
  success: boolean;
  filePath?: string;
  error?: string;
};

/**
 * Validasi Magic Bytes (File Signature) di sisi server.
 * Mencegah serangan Content-Spoofing di mana penyerang mengunggah skrip berbahaya
 * yang hanya diubah ekstensinya menjadi .jpg atau .png.
 */
function validateMagicBytes(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;

  // JPEG / JPG: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a;

  // WEBP: 'RIFF'....'WEBP' (Bytes 0-3: 52 49 46 46, Bytes 8-11: 57 45 42 50)
  const isWebp =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  return isJpeg || isPng || isWebp;
}

/**
 * Menyimpan file sampul buku secara aman:
 * 1. Validasi ukuran (<= 1MB)
 * 2. Validasi MIME type
 * 3. Validasi ekstensi
 * 4. Validasi Magic Bytes (Signature)
 * 5. Kompatibilitas Serverless (Vercel):
 *    Pada lingkungan Vercel serverless (di mana disk bersifat read-only),
 *    gambar yang telah tervalidasi aman disimpan sebagai Data URI (base64)
 *    langsung di database sehingga persisten dan tidak melempar error EROFS.
 *    Pada lingkungan lokal, file disimpan ke folder disk lokal.
 */
export async function saveCoverImage(file: File): Promise<UploadResult> {
  // 1. Cek ukuran file
  if (file.size > MAX_FILE_SIZE) {
    return {
      success: false,
      error: "Ukuran file melebihi batas maksimal 1 MB.",
    };
  }

  // 2. Cek MIME Type dari header browser
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "Format file tidak diizinkan. Hanya menerima JPG, PNG, atau WEBP.",
    };
  }

  // 3. Cek ekstensi file asli
  const originalExt = path.extname(file.name).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(originalExt)) {
    return {
      success: false,
      error: "Ekstensi file tidak valid. Gunakan format .jpg, .png, atau .webp.",
    };
  }

  // 4. Baca buffer dan verifikasi Magic Bytes
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (!validateMagicBytes(buffer)) {
    return {
      success: false,
      error: "Integritas file gagal divalidasi. File bukan gambar yang valid.",
    };
  }

  // 5. Penanganan Serverless vs Local Filesystem
  const isVercelProduction = process.env.VERCEL === "1" || process.env.NODE_ENV === "production";

  if (isVercelProduction) {
    // Pada serverless Vercel: simpan sebagai data URL base64 terenkapsulasi
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    return {
      success: true,
      filePath: dataUrl,
    };
  }

  // Pada pengembangan lokal: simpan ke disk public/uploads/covers/
  try {
    const safeExt = originalExt === ".jpeg" ? ".jpg" : originalExt;
    const uniqueFileName = `${crypto.randomUUID()}${safeExt}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads", "covers");
    await fs.mkdir(uploadDir, { recursive: true });

    const finalPath = path.join(uploadDir, uniqueFileName);
    await fs.writeFile(finalPath, buffer);

    return {
      success: true,
      filePath: `/uploads/covers/${uniqueFileName}`,
    };
  } catch (fsError) {
    // Fallback otomatis ke data URI jika penulisan disk lokal terkendala izin
    const mimeType = file.type || "image/jpeg";
    const base64Data = buffer.toString("base64");
    return {
      success: true,
      filePath: `data:${mimeType};base64,${base64Data}`,
    };
  }
}
