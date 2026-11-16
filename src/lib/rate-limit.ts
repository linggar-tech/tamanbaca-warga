import prisma from "@/lib/prisma";

export interface RateLimitOptions {
  limit: number;    // Jumlah request maksimal yang diizinkan
  windowMs: number; // Jendela waktu dalam milidetik
}

/**
 * Rate Limiting berbasis Database (Tabel AuditLog).
 * Efektif untuk arsitektur serverless (seperti Vercel) di mana memori in-memory bersifat ephemeral
 * dan tidak dibagi antar-instans container serverless.
 */
export async function checkDbRateLimit(
  action: string | string[],
  ipAddress: string,
  options: RateLimitOptions = { limit: 5, windowMs: 60 * 1000 }
): Promise<{ success: boolean; remaining: number }> {
  try {
    const windowStart = new Date(Date.now() - options.windowMs);
    const actionFilter = Array.isArray(action) ? { in: action } : action;

    const count = await prisma.auditLog.count({
      where: {
        action: actionFilter,
        ipAddress,
        createdAt: { gte: windowStart },
      },
    });

    if (count >= options.limit) {
      return { success: false, remaining: 0 };
    }

    return { success: true, remaining: options.limit - count };
  } catch (error) {
    console.error("[RateLimit DB Error]:", error);
    // Graceful fallback agar pengguna tidak terblokir total saat DB offline
    return { success: true, remaining: 1 };
  }
}

// Memory map untuk endpoint lokal / non-kritis (misal ekspor)
type RateLimitRecord = {
  count: number;
  resetTime: number;
};

const rateLimitMap = new Map<string, RateLimitRecord>();

/**
 * Rate limiting in-memory untuk API non-kritis atau fallback
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { limit: 10, windowMs: 60 * 1000 }
): { success: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
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
