import { render } from "@react-email/render";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
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

export type InquiryStatusUI = "pending" | "registered" | "not_interested";

/** Map legacy + current DB values to UI status */
export function normalizeInquiryStatus(raw: string | undefined): InquiryStatusUI {
  if (raw === "pending" || raw === "registered" || raw === "not_interested") {
    return raw;
  }
  if (raw === "new" || raw === "contacted") return "pending";
  if (raw === "converted") return "registered";
  if (raw === "closed") return "not_interested";
  return "pending";
}

function statusFilterForQuery(uiStatus: InquiryStatusUI): { $in: string[] } {
  switch (uiStatus) {
    case "pending":
      return { $in: ["pending", "new", "contacted"] };
    case "registered":
      return { $in: ["registered", "converted"] };
    case "not_interested":
      return { $in: ["not_interested", "closed"] };
    default:
      return { $in: ["pending", "new", "contacted"] };
  }
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
    courseOfInterest: data.courseOfInterest,
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

/**
 * Get all inquiries (admin/staff only)
 */
export const getAllInquiries = async (filters?: { status?: string }) => {
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

  const filter: Record<string, unknown> = {};
  if (filters?.status && filters.status !== "") {
    const ui = filters.status as InquiryStatusUI;
    if (["pending", "registered", "not_interested"].includes(ui)) {
      filter.status = statusFilterForQuery(ui);
    }
  }

  const inquiries = await InquiryModel.find(filter)
    .populate("customerCareId", "name email")
    .sort("-createdAt")
    .lean();

  return inquiries.map((i) => formatInquiryDoc(i as Record<string, unknown>));
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

  const allowedStatus: InquiryStatusUI[] = ["pending", "registered", "not_interested"];
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

  return { success: true };
};
