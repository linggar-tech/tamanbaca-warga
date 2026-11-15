import prisma from "@/lib/prisma";

export interface LogAuditParams {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  ipAddress?: string | null;
  details?: string | null;
}

/**
 * Mencatat peristiwa penting ke tabel AuditLog untuk keperluan forensik & akuntabilitas sistem.
 */
export async function createAuditLog(params: LogAuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId ?? null,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId ?? null,
        ipAddress: params.ipAddress ?? "unknown",
        details: params.details ?? null,
      },
    });
  } catch (error) {
    // Audit logging tidak boleh memutus request flow utama jika gagal, namun dicatat di server error log
    console.error("[AUDIT LOG ERROR]", error);
  }
}
