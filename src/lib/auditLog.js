import { base44 } from "@/api/base44Client";

/**
 * Log an admin action to the AuditLog entity.
 * Safe to call fire-and-forget; errors are silently ignored.
 */
export async function logAdminAction({ admin, action, targetType, targetId, details }) {
  try {
    await base44.entities.AuditLog.create({
      adminId: admin?.id || "unknown",
      adminName: admin?.full_name || admin?.email || "Admin",
      action,
      targetType,
      targetId: targetId || "",
      details: details || "",
      createdAt: new Date().toISOString(),
    });
  } catch (_) {}
}