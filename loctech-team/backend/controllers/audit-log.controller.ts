import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { AuditLogModel } from "../models/audit-log.model";

/**
 * Create audit log entry (internal use - call from other controllers)
 */
export const createAuditLog = async (data: {
  userId: string;
  userEmail?: string;
  userName?: string;
  action: "create" | "update" | "delete" | "login" | "logout";
  resource: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}) => {
  await connectToDatabase();
  await AuditLogModel.create(data);
};

/**
 * Best-effort audit from a NextAuth session. Skips when no user id (e.g. public routes).
 * Never throws — failures are logged only.
 */
export async function auditLog(
  session: Session | null,
  entry: Omit<
    Parameters<typeof createAuditLog>[0],
    "userId" | "userEmail" | "userName"
  >
): Promise<void> {
  const uid = session?.user?.id;
  if (!uid) return;
  try {
    await createAuditLog({
      userId: uid,
      userEmail: session.user.email ?? undefined,
      userName: session.user.name ?? undefined,
      ...entry,
    });
  } catch (e) {
    console.error("auditLog failed:", e);
  }
}

/**
 * Get audit logs (super_admin only)
 */
export const getAuditLogs = async (filters?: {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "super_admin") {
    throw new Error("Forbidden - Audit logs are super_admin only");
  }

  const filter: Record<string, unknown> = {};
  if (filters?.userId) filter.userId = filters.userId;
  if (filters?.action) filter.action = filters.action;
  if (filters?.resource) filter.resource = filters.resource;
  if (filters?.startDate || filters?.endDate) {
    filter.createdAt = {};
    if (filters.startDate) (filter.createdAt as Record<string, Date>).$gte = filters.startDate;
    if (filters.endDate) (filter.createdAt as Record<string, Date>).$lte = filters.endDate;
  }

  const limit = Math.min(filters?.limit ?? 100, 500);
  const offset = filters?.offset ?? 0;

  const logs = await AuditLogModel.find(filter)
    .sort("-createdAt")
    .skip(offset)
    .limit(limit)
    .lean();

  const total = await AuditLogModel.countDocuments(filter);

  return {
    logs: logs.map((l) => ({
      id: String(l._id),
      userId: String(l.userId),
      userEmail: l.userEmail,
      userName: l.userName,
      action: l.action,
      resource: l.resource,
      resourceId: l.resourceId,
      details: l.details,
      createdAt: (l.createdAt as Date)?.toISOString?.(),
    })),
    total,
  };
};
