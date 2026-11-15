import bcrypt from "bcryptjs";

// Cost factor minimal 12 untuk hashing password (standar keamanan modern tahan brute-force)
const BCRYPT_SALT_ROUNDS = 12;

/**
 * Melakukan hashing password dengan bcrypt dan salt round 12.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

/**
 * Memverifikasi kecocokan plain text password dengan hash yang tersimpan di database.
 * Melindungi dari serangan timing attack karena bcrypt membandingkan hash secara konstan.
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Aturan validasi password:
 * - Minimal 10 karakter
 * - Wajib mengandung minimal satu huruf (a-z / A-Z)
 * - Wajib mengandung minimal satu angka (0-9)
 */
export function isPasswordStrong(password: string): { isValid: boolean; message?: string } {
  if (password.length < 10) {
    return {
      isValid: false,
      message: "Password minimal harus 10 karakter.",
    };
  }
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);

  if (!hasLetter || !hasNumber) {
    return {
      isValid: false,
      message: "Password wajib mengombinasikan minimal satu huruf dan satu angka.",
    };
  }

  return { isValid: true };
}
