// Utilitas Rate Limiting Sederhana & Efisien Berbasis In-Memory Token Bucket / Window
// Melindungi aplikasi dari serangan brute-force, credential stuffing, dan DoS ringan.

type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

// Bersihkan data lama secara berkala setiap 5 menit untuk mencegah memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  limit: number;        // Jumlah request maksimal yang diizinkan
  windowMs: number;     // Jendela waktu dalam milidetik
}

/**
 * Memeriksa apakah identifier (misal IP address atau gabungan IP+endpoint) melewati batas limit.
 * Return true jika diizinkan, false jika telah melewati limit (rate limited).
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 }
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    // Jendela waktu baru
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + options.windowMs,
    });
    return {
      success: true,
      remaining: options.limit - 1,
      resetTime: now + options.windowMs,
    };
  }

  if (record.count >= options.limit) {
    return {
      success: false,
      remaining: 0,
      resetTime: record.resetTime,
    };
  }

  record.count += 1;
  return {
    success: true,
    remaining: options.limit - record.count,
    resetTime: record.resetTime,
  };
}
