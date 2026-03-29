import { render } from "@react-email/render";
import { authConfig, hashPassword } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { parse } from "csv-parse";
import fs from "fs";
import path from "path";
import { InquiryModel } from "../models/inquiry.model";
import { StudentModel } from "../models/students.model";
import { UserModel } from "../models/user.model";
import {
  ResendService,
  getTransactionalFrom,
  getContactInboxAddress,
} from "../services/resend.service";
import InquiryReceivedEmail from "@/emails/inquiry-received";
import { CourseModel } from "../models/courses.model";
import type { AnyBulkWriteOperation } from "mongoose";
import { SlackService } from "../services/slack.service";
import { buildStudentRegistrationBlock } from "@/lib/slack-blocks";
import type { Student } from "@/types";
import { auditLog } from "./audit-log.controller";

export type InquiryStatusUI =
  | "pending"
  | "registered"
  | "converted"
  | "not_interested";

/** Map legacy + current DB values to UI status */
export function normalizeInquiryStatus(raw: string | undefined): InquiryStatusUI {
  if (
    raw === "pending" ||
    raw === "registered" ||
    raw === "converted" ||
    raw === "not_interested"
  ) {
    return raw;
  }
  if (raw === "new" || raw === "contacted") return "pending";
  if (raw === "closed") return "not_interested";
  return "pending";
}

function statusFilterForQuery(uiStatus: InquiryStatusUI): { $in: string[] } {
  switch (uiStatus) {
    case "pending":
      return { $in: ["pending", "new", "contacted"] };
    case "registered":
      return { $in: ["registered"] };
    case "converted":
      return { $in: ["converted"] };
    case "not_interested":
      return { $in: ["not_interested", "closed"] };
    default:
      return { $in: ["pending", "new", "contacted"] };
  }
}

function heardFromFromInquiry(raw: string | undefined | null): Student["heardFrom"] {
  const v = raw?.trim().toLowerCase() ?? "";
  if (!v) return "Other";
  if (v.includes("google")) return "Google";
  if (v.includes("facebook")) return "Facebook";
  if (v.includes("twitter")) return "Twitter";
  if (v.includes("loctech")) return "Loctech Website";
  if (v.includes("radio")) return "Radio";
  if (v.includes("billboard")) return "Billboard";
  if (v.includes("instagram")) return "Instagram";
  if (v.includes("flyer")) return "Flyers";
  if (v.includes("friend")) return "Friends";
  return "Other";
}

function formatInquiryDoc(i: Record<string, unknown>) {
  const customerCare = i.customerCareId as
    | { _id?: unknown; name?: string; email?: string }
    | null
    | undefined;
  const statusUi = normalizeInquiryStatus(i.status as string | undefined);

  return {
    id: String(i._id),
    name: i.name,
    email: i.email,
    phone: i.phone ?? null,
    courseOfInterest: i.courseOfInterest ?? null,
    heardAboutUs: i.heardAboutUs ?? null,
    message: i.message,
    customerCareId: customerCare?._id ? String(customerCare._id) : null,
    customerCare: customerCare?.name
      ? {
        id: String(customerCare._id),
        name: customerCare.name,
        email: customerCare.email ?? "",
      }
      : null,
    lead: (i.lead as string) ?? "warm",
    feedback: i.feedback ?? null,
    followUp: i.followUp ?? null,
    status: statusUi,
    rawStatus: i.status,
    adminNote: i.adminNote ?? null,
    autoReplySent: i.autoReplySent ?? false,
    respondedAt: i.respondedAt
      ? (i.respondedAt as Date).toISOString()
      : null,
    convertedToStudentId: i.convertedToStudentId
      ? String(i.convertedToStudentId)
      : null,
    createdAt: (i.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (i.updatedAt as Date)?.toISOString?.() ?? "",
  };
}

/**
 * Submit inquiry (public - no auth required)
 */
export const createInquiry = async (data: {
  name: string;
  email: string;
  phone?: string;
  courseOfInterest?: string;
  heardAboutUs?: string;
  message: string;
}) => {
  await connectToDatabase();
  const course = await CourseModel.findById(data.courseOfInterest);
  const courseTitle = course?.title || "our programs";

  const inquiry = await InquiryModel.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    courseOfInterest: courseTitle,
    heardAboutUs: data.heardAboutUs,
    message: data.message,
    status: "pending",
    lead: "warm",
    autoReplySent: false,
  });

  const contactEmail = getContactInboxAddress();

  try {
    const html = await render(
      InquiryReceivedEmail({
        name: data.name,
        courseOfInterest: courseTitle,
        contactEmail,
      })
    );

    await ResendService.sendEmail({
      from: getTransactionalFrom(),
      to: data.email,
      replyTo: contactEmail,
      subject: "We Received Your Inquiry - Loctech Training Institute",
      html,
    });

    await InquiryModel.findByIdAndUpdate(inquiry._id, { autoReplySent: true });
  } catch (err) {
    console.error("Failed to send inquiry auto-reply:", err);
  }

  return {
    id: String(inquiry._id),
    message: "Thank you for your inquiry. We will get back to you soon.",
  };
};

/**
 * Staff / admins assignable as customer care (for dropdowns)
 */
export const listAssignableStaffForInquiries = async () => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  const users = await UserModel.find({
    role: { $in: ["staff", "admin", "super_admin"] },
    isActive: true,
  })
    .select("name email role")
    .sort({ name: 1 })
    .lean();

  return users.map((u) => ({
    id: String(u._id),
    name: u.name,
    email: u.email,
    role: u.role,
  }));
};

export type GetAllInquiriesParams = {
  status?: string;
  /** 1-based page index */
  page?: number;
  /** Page size (capped at 100) */
  limit?: number;
};

export type PaginatedInquiries = {
  inquiries: ReturnType<typeof formatInquiryDoc>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const DEFAULT_INQUIRY_PAGE_SIZE = 20;
const MAX_INQUIRY_PAGE_SIZE = 100;

/**
 * For pending inquiries whose email matches a student record, set status to
 * registered and link convertedToStudentId (matched by email, case-insensitive).
 */
export const markRegisteredInquiry = async (): Promise<{
  examined: number;
  updated: number;
}> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  const pendingFilter = { status: statusFilterForQuery("pending") };

  const inquiries = await InquiryModel.find(pendingFilter)
    .select("_id email")
    .lean();

  if (inquiries.length === 0) {
    return { examined: 0, updated: 0 };
  }

  const uniqueEmails = [
    ...new Set(
      inquiries
        .map((i) => String(i.email ?? "").toLowerCase().trim())
        .filter(Boolean)
    ),
  ];

  const students = await StudentModel.find({
    email: { $in: uniqueEmails },
  })
    .select("_id email")
    .lean();

  const emailToStudentId = new Map(
    students.map((s) => [String(s.email).toLowerCase(), String(s._id)])
  );

  const now = new Date();
  const respondedBy = session.user.id;

  const bulkOps: AnyBulkWriteOperation<Record<string, unknown>>[] = [];

  for (const inv of inquiries) {
    const em = String(inv.email ?? "").toLowerCase().trim();
    if (!em) continue;
    const studentId = emailToStudentId.get(em);
    if (!studentId) continue;

    bulkOps.push({
      updateOne: {
        filter: { _id: inv._id },
        update: {
          $set: {
            status: "registered",
            convertedToStudentId: studentId,
            respondedAt: now,
            respondedBy,
          },
        },
      },
    });
  }

  if (bulkOps.length === 0) {
    return { examined: inquiries.length, updated: 0 };
  }

  const result = await InquiryModel.bulkWrite(bulkOps, { ordered: false });
  const updated = result.modifiedCount + result.upsertedCount;

  await auditLog(session, {
    action: "update",
    resource: "inquiry_sync",
    details: { examined: inquiries.length, updated },
  });

  return { examined: inquiries.length, updated };
};

/**
 * Get inquiries with pagination (admin/staff only)
 */
export const getAllInquiries = async (
  filters?: GetAllInquiriesParams
): Promise<PaginatedInquiries> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }
  // loadInquiriesFromCsv();

  const filter: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "") {
    const ui = filters.status as InquiryStatusUI;
    if (["pending", "registered", "not_interested"].includes(ui)) {
      filter.status = statusFilterForQuery(ui);
    }
  }

  const page = Math.max(1, filters?.page ?? 1);
  const limit = Math.min(
    MAX_INQUIRY_PAGE_SIZE,
    Math.max(1, filters?.limit ?? DEFAULT_INQUIRY_PAGE_SIZE)
  );
  const skip = (page - 1) * limit;

  const [total, inquiries] = await Promise.all([
    InquiryModel.countDocuments(filter),
    InquiryModel.find(filter)
      .populate("customerCareId", "name email")
      .sort("-createdAt")
      .skip(skip)
      .limit(limit)
      .lean(),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return {
    inquiries: inquiries.map((i) =>
      formatInquiryDoc(i as Record<string, unknown>)
    ),
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

/**
 * Update inquiry (admin/staff)
 */
export const updateInquiry = async (
  id: string,
  data: Partial<{
    customerCareId: string | null;
    lead: "hot" | "warm" | "cold";
    feedback: string;
    followUp: "called" | "text_whatsapp" | "call_back" | null;
    status: InquiryStatusUI;
    adminNote: string;
  }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  const existing = await InquiryModel.findById(id);
  if (!existing) throw new Error("Inquiry not found");

  const allowedStatus: InquiryStatusUI[] = [
    "pending",
    "registered",
    "converted",
    "not_interested",
  ];
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, 1> = {};

  if (data.customerCareId !== undefined) {
    if (data.customerCareId) {
      $set.customerCareId = data.customerCareId;
    } else {
      $unset.customerCareId = 1;
    }
  }
  if (data.lead !== undefined) {
    if (!["hot", "warm", "cold"].includes(data.lead)) throw new Error("Invalid lead");
    $set.lead = data.lead;
  }
  if (data.feedback !== undefined) $set.feedback = data.feedback;
  if (data.followUp !== undefined) {
    if (data.followUp === null) {
      $unset.followUp = 1;
    } else {
      $set.followUp = data.followUp;
    }
  }
  if (data.status !== undefined) {
    if (!allowedStatus.includes(data.status)) throw new Error("Invalid status");
    $set.status = data.status;
  }
  if (data.adminNote !== undefined) $set.adminNote = data.adminNote;

  const updatePayload: Record<string, unknown> = {};
  if (Object.keys($set).length) updatePayload.$set = $set;
  if (Object.keys($unset).length) updatePayload.$unset = $unset;

  if (Object.keys(updatePayload).length) {
    await InquiryModel.findByIdAndUpdate(id, updatePayload);
  }

  const updated = await InquiryModel.findById(id)
    .populate("customerCareId", "name email")
    .lean();

  await auditLog(session, {
    action: "update",
    resource: "inquiry",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });

  return formatInquiryDoc(updated as Record<string, unknown>);
};

/**
 * Mark inquiry as responded (quick action: follow-up = called)
 */
export const markInquiryResponded = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  await InquiryModel.findByIdAndUpdate(id, {
    followUp: "called",
    respondedAt: new Date(),
    respondedBy: session.user.id,
  });

  await auditLog(session, {
    action: "update",
    resource: "inquiry",
    resourceId: id,
    details: { action: "mark_responded" },
  });

  return { success: true };
};

/**
 * Mark inquiry as converted → registered + link student
 */
export const markInquiryConverted = async (id: string, studentId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  const student = await StudentModel.findById(studentId);
  if (!student) throw new Error("Student not found");

  await InquiryModel.findByIdAndUpdate(id, {
    status: "registered",
    respondedAt: new Date(),
    respondedBy: session.user.id,
    convertedToStudentId: studentId,
  });

  await auditLog(session, {
    action: "update",
    resource: "inquiry",
    resourceId: id,
    details: { action: "link_student", studentId },
  });

  return { success: true };
};

/**
 * Create a student account from an inquiry (onboarding — no assessment).
 */
export const convertInquiryToStudent = async (
  inquiryId: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    dateOfBirth?: string;
    highestQualification?: string;
    stateOfOrigin?: string;
    nationality?: string;
    occupation?: string;
  }
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  const inquiry = await InquiryModel.findById(inquiryId).lean();
  if (!inquiry) throw new Error("Inquiry not found");
  if (inquiry.convertedToStudentId) {
    throw new Error("This inquiry has already been converted");
  }

  const name = (data.name ?? inquiry.name)?.trim();
  const email = (data.email ?? inquiry.email)?.toLowerCase().replace(/\s+/g, "");
  if (!name || !email) throw new Error("Name and email are required");

  const existing = await StudentModel.findOne({ email });
  if (existing) throw new Error("A student with this email already exists");

  const phone = (data.phone ?? inquiry.phone ?? "").trim() || "—";
  const normalizedName = name.toLowerCase().replace(/\s+/g, "");
  const password = `${normalizedName}@loctech`;
  const passwordHash = await hashPassword(password);

  const newStudent = await StudentModel.create({
    name,
    email,
    phone,
    address: data.address?.trim() || "—",
    dateOfBirth: data.dateOfBirth
      ? new Date(data.dateOfBirth)
      : new Date("2000-01-01T00:00:00.000Z"),
    highestQualification: data.highestQualification?.trim() || "Not specified",
    stateOfOrigin: data.stateOfOrigin?.trim() || "Not specified",
    nationality: data.nationality?.trim() || "Not specified",
    occupation: data.occupation?.trim() || "Not specified",
    heardFrom: heardFromFromInquiry(inquiry.heardAboutUs),
    nextOfKin: {
      name: "—",
      relationship: "—",
      contact: phone !== "—" ? phone : "—",
    },
    passwordHash,
    status: "pending",
  });

  await InquiryModel.findByIdAndUpdate(inquiryId, {
    status: "converted",
    convertedToStudentId: newStudent._id,
    respondedAt: new Date(),
    respondedBy: session.user.id,
  });

  await SlackService.sendChannelMessage(
    "#student-mgt",
    buildStudentRegistrationBlock(
      newStudent.name,
      newStudent.email,
      newStudent.phone,
      0
    )
  );

  await auditLog(session, {
    action: "create",
    resource: "student_from_inquiry",
    resourceId: String(newStudent._id),
    details: { inquiryId, email: newStudent.email },
  });

  return {
    studentId: String(newStudent._id),
    email: newStudent.email,
  };
};

/* ─── Seed inquiries from assets/inquiries.csv (same pattern as loadStudentsData) ─── */

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Strip UTF-8 BOM so `010` header matches (Excel often saves as `\ufeff010`) */
function stripBom(s: string) {
  return s.replace(/^\ufeff/, "").trim();
}

/**
 * First column in the sheet is mislabeled "010" — value is submitted date/time.
 * Formats seen: `8/29/2025 9:42:54`, `9/1/2025 8:57:34`, `3/3/2026`, `13/3/2026`
 */
function getInquiryCsvDateRaw(row: Record<string, string>): string {
  const entries = Object.entries(row);

  for (const [k, v] of entries) {
    const nk = stripBom(k);
    if (nk === "010" || nk === "Date" || nk === "Timestamp") {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
  }

  for (const [k, v] of entries) {
    const nk = stripBom(k);
    if (/^\d+$/.test(nk)) {
      const s = String(v ?? "").trim();
      if (s) return s;
    }
  }

  // First column cell (column order) — reliable when header is BOM-corrupted
  const first = entries[0];
  if (first) {
    const s = String(first[1] ?? "").trim();
    if (/^\d{1,2}\/\d{1,2}\/\d{2,4}/.test(s)) return s;
  }

  return "";
}

function getCell(row: Record<string, string>, ...want: string[]): string {
  for (const w of want) {
    const v = row[w];
    if (v !== undefined && String(v).trim() !== "") return String(v).trim();
  }
  const lowerWants = want.map((w) => w.trim().toLowerCase());
  for (const key of Object.keys(row)) {
    const lk = key.trim().toLowerCase();
    if (lowerWants.includes(lk)) return String(row[key] ?? "").trim();
  }
  for (const key of Object.keys(row)) {
    const lk = key.trim().toLowerCase();
    for (const w of want) {
      if (lk.includes(w.trim().toLowerCase())) return String(row[key] ?? "").trim();
    }
  }
  return "";
}

/**
 * Parse dates like 8/29/2025 9:42:54 (US-style M/D/Y) or 13/3/2026 (D/M/Y when day > 12)
 */
function parseInquiryCsvDate(value: string | undefined): Date | null {
  if (!value) return null;
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;

  const dateTime = trimmed.split(" ").filter(Boolean);
  const datePart = dateTime[0] ?? trimmed;
  const timePart =
    dateTime.length > 1 ? dateTime.slice(1).join(" ") : "";

  const m = datePart.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let y = Number(m[3]);
    if (y < 100) y += 2000;

    let month: number;
    let day: number;
    if (a > 12) {
      day = a;
      month = b - 1;
    } else if (b > 12) {
      month = a - 1;
      day = b;
    } else {
      month = a - 1;
      day = b;
    }

    const d = new Date(y, month, day);
    if (isNaN(d.getTime())) return null;

    if (timePart) {
      const tm = timePart.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
      if (tm) {
        d.setHours(Number(tm[1]), Number(tm[2]), tm[3] ? Number(tm[3]) : 0, 0);
      }
    }
    return d;
  }

  // Last resort: let JS parse (works for many US-style strings in Node)
  const fallback = new Date(trimmed);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

function normalizeCsvLead(raw: string | undefined): "hot" | "warm" | "cold" | undefined {
  const v = raw?.trim().toLowerCase();
  if (!v) return undefined;
  if (v.includes("hot")) return "hot";
  if (v.includes("warm")) return "warm";
  if (v.includes("cold")) return "cold";
  return undefined;
}

function normalizeCsvFollowUp(
  raw: string | undefined
): "called" | "text_whatsapp" | "call_back" | undefined {
  const v = raw?.trim().toLowerCase();
  if (!v) return undefined;
  if (v.includes("call back") || v.replace(/\s/g, "") === "callback") return "call_back";
  if (v.includes("text") || v.includes("whatsapp")) return "text_whatsapp";
  if (v.includes("call")) return "called";
  return undefined;
}

function normalizeCsvStatus(raw: string | undefined): string {
  const v = raw?.trim().toLowerCase();
  if (!v) return "pending";
  if (v.includes("not interested")) return "not_interested";
  if (v.includes("registered") || v.includes("secured")) return "registered";
  if (v.includes("pending")) return "pending";
  return "pending";
}

const inquiryCsvStaffCache = new Map<string, string | null>();

async function resolveCustomerCareIdByName(name: string): Promise<string | undefined> {
  const key = name.trim().toLowerCase();
  if (!key) return undefined;
  if (inquiryCsvStaffCache.has(key)) {
    const id = inquiryCsvStaffCache.get(key);
    return id ?? undefined;
  }
  const user = await UserModel.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(name.trim())}$`, "i") },
    isActive: true,
  })
    .select("_id")
    .lean();
  const id = user?._id ? String(user._id) : null;
  inquiryCsvStaffCache.set(key, id);
  return id ?? undefined;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatInquiryCsvRecord(
  raw: Record<string, any>,
  rowIndex = 0
): {
  name: string;
  email: string;
  phone: string;
  courseOfInterest: string;
  heardAboutUs: string;
  message: string;
  customerCareName: string;
  lead?: "hot" | "warm" | "cold";
  feedback: string;
  followUp?: "called" | "text_whatsapp" | "call_back";
  status: string;
  adminNote: string;
  createdAt: Date;
} | null {
  const name = getCell(raw, "Name");
  const email = getCell(raw, "Email").toLowerCase();
  const phone = getCell(raw, "Phone Number", "Phone").replace(/\s+/g, " ").trim();
  const courseOfInterest = getCell(raw, "Course of Interest ", "Course of Interest");
  const heardAboutUs = getCell(raw, "How Did You Hear About Us:", "How Did You Hear About Us");
  const customerCareName = getCell(raw, "Customer Care");
  const lead = normalizeCsvLead(getCell(raw, "Lead"));
  const feedback = getCell(raw, "Feedback");
  const followUp = normalizeCsvFollowUp(getCell(raw, "Follow up", "Follow Up"));
  const status = normalizeCsvStatus(getCell(raw, "Status"));
  const col1 = getCell(raw, "Column 1");
  const col2 = getCell(raw, "Column 2");
  const col3 = getCell(raw, "Column 3");
  const adminNote = [col1, col2, col3].filter(Boolean).join(" | ");

  if (!name || !email || !email.includes("@")) return null;

  const dateRaw = getInquiryCsvDateRaw(raw as Record<string, string>);
  let createdAt = parseInquiryCsvDate(dateRaw) ?? null;
  // Only use synthetic time when the sheet truly has no parseable date (not "now")
  if (!createdAt) {
    createdAt = new Date(Date.UTC(2025, 0, 1) + rowIndex * 1000);
  }

  const messageParts = [
    "[Imported from inquiries CSV]",
    courseOfInterest ? `Course interest: ${courseOfInterest}.` : "",
    feedback ? `Feedback: ${feedback}.` : "",
  ].filter(Boolean);
  const message =
    messageParts.join(" ").trim() || "[Imported from inquiries CSV]";

  return {
    name,
    email,
    phone,
    courseOfInterest,
    heardAboutUs,
    message,
    customerCareName,
    lead,
    feedback,
    followUp,
    status,
    adminNote,
    createdAt,
  };
}

async function saveInquiryFromCsv(formatted: NonNullable<ReturnType<typeof formatInquiryCsvRecord>>) {
  const customerCareId = formatted.customerCareName
    ? await resolveCustomerCareIdByName(formatted.customerCareName)
    : undefined;

  const doc = {
    name: formatted.name,
    email: formatted.email,
    phone: formatted.phone || undefined,
    courseOfInterest: formatted.courseOfInterest || undefined,
    heardAboutUs: formatted.heardAboutUs || undefined,
    message: formatted.message,
    customerCareId: customerCareId || undefined,
    lead: formatted.lead ?? "warm",
    feedback: formatted.feedback || undefined,
    followUp: formatted.followUp,
    status: formatted.status,
    adminNote: formatted.adminNote || undefined,
    autoReplySent: true,
    createdAt: formatted.createdAt,
    updatedAt: new Date(),
  };

  // timestamps: false — otherwise Mongoose can set createdAt to "now" on upsert insert
  await InquiryModel.updateOne(
    {
      email: formatted.email,
      name: formatted.name,
      createdAt: {
        $gte: new Date(formatted.createdAt.getTime() - 5000),
        $lte: new Date(formatted.createdAt.getTime() + 5000),
      },
    },
    { $set: doc },
    { upsert: true, timestamps: false }
  );
}

/**
 * Load `assets/inquiries.csv` into the Inquiry collection (no Resend emails).
 * Mirrors `loadStudentsData` in students.controller.ts.
 */
export async function loadInquiriesFromCsv() {
  await connectToDatabase();
  inquiryCsvStaffCache.clear();

  const filePath = path.join(process.cwd(), "assets", "inquiries.csv");
  console.log("Resolved inquiries CSV path:", filePath);

  if (!fs.existsSync(filePath)) {
    console.error("inquiries.csv not found at", filePath);
    throw new Error(`File not found: ${filePath}`);
  }

  const rows: Record<string, string>[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(
        parse({
          bom: true,
          columns: (header: string[]) =>
            header.map((h) => h.replace(/^\ufeff/, "").trim()),
          comment: "#",
          relax_column_count: true,
          trim: true,
          skip_empty_lines: true,
        })
      )
      .on("data", (data: Record<string, string>) => {
        rows.push(data);
      })
      .on("error", (err: Error) => {
        console.error("Error reading inquiries CSV:", err);
        reject(err);
      })
      .on("end", () => resolve());
  });

  let saved = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i++) {
    try {
      const formatted = formatInquiryCsvRecord(rows[i], i);
      if (!formatted) {
        skipped++;
        continue;
      }
      await saveInquiryFromCsv(formatted);
      saved++;
    } catch (error) {
      console.error("Could not save inquiry row:", error);
      skipped++;
    }
  }

  const total = await InquiryModel.countDocuments({});
  console.log("✅ Inquiries CSV load complete");
  console.log(`${saved} rows upserted, ${skipped} skipped. Total inquiries in DB: ${total}.`);
}
