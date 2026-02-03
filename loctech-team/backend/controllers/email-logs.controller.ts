import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { EmailLogModel } from "../models/email-log.model";

/* eslint-disable */

/**
 * Format email log document for frontend
 */
export const formatEmailLog = (log: Record<string, any>) => {
  const template = log.templateId as Record<string, any> | null;

  return {
    id: String(log._id),
    templateId: log.templateId ? String(log.templateId) : null,
    template: template
      ? {
        id: String(template._id),
        name: template.name ?? "",
        type: template.type ?? "",
      }
      : null,
    recipientEmail: log.recipientEmail ?? "",
    subject: log.subject ?? "",
    body: log.body ?? "",
    status: log.status ?? "pending",
    errorMessage: log.errorMessage ?? null,
    sentAt: log.sentAt ? (log.sentAt as Date)?.toISOString?.() : null,
    createdAt: (log.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (log.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL EMAIL LOGS
 */
export const getAllEmailLogs = async (filters?: {
  recipientEmail?: string;
  status?: string;
  templateId?: string;
  limit?: number;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin and super_admin can view email logs
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const filter: Record<string, any> = {};
  if (filters?.recipientEmail) filter.recipientEmail = filters.recipientEmail;
  if (filters?.status) filter.status = filters.status;
  if (filters?.templateId) filter.templateId = filters.templateId;

  const query = EmailLogModel.find(filter)
    .populate("templateId", "name type")
    .sort("-createdAt");

  if (filters?.limit) {
    query.limit(filters.limit);
  }

  const logs = await query.lean();

  return logs.map((log) => formatEmailLog(log));
};

/**
 * 🟦 GET ONE EMAIL LOG
 */
export const getEmailLogById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const log = await EmailLogModel.findById(id)
    .populate("templateId", "name type")
    .lean();

  if (!log) return null;

  return formatEmailLog(log);
};

/**
 * GET EMAIL LOGS BY RECIPIENT
 * Only admin and super_admin can view email logs (staff app has no student role).
 */
export const getEmailLogsByRecipient = async (email: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const logs = await EmailLogModel.find({ recipientEmail: email })
    .populate("templateId", "name type")
    .sort("-createdAt")
    .limit(50)
    .lean();

  return logs.map((log) => formatEmailLog(log));
};

/**
 * GET EMAIL STATISTICS
 */
export const getEmailStatistics = async () => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const total = await EmailLogModel.countDocuments();
  const sent = await EmailLogModel.countDocuments({ status: "sent" });
  const failed = await EmailLogModel.countDocuments({ status: "failed" });
  const pending = await EmailLogModel.countDocuments({ status: "pending" });
  const delivered = await EmailLogModel.countDocuments({
    status: "delivered",
  });
  const bounced = await EmailLogModel.countDocuments({ status: "bounced" });

  return {
    total,
    sent,
    failed,
    pending,
    delivered,
    bounced,
    successRate: total > 0 ? ((sent + delivered) / total) * 100 : 0,
  };
};
