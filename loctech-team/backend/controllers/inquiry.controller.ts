import { render } from "@react-email/render";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { InquiryModel } from "../models/inquiry.model";
import { StudentModel } from "../models/students.model";
import { ResendService } from "../services/resend.service";
import InquiryReceivedEmail from "@/emails/inquiry-received";

/**
 * Submit inquiry (public - no auth required)
 */
export const createInquiry = async (data: {
  name: string;
  email: string;
  phone?: string;
  courseOfInterest?: string;
  message: string;
}) => {
  await connectToDatabase();

  const inquiry = await InquiryModel.create({
    name: data.name,
    email: data.email,
    phone: data.phone,
    courseOfInterest: data.courseOfInterest,
    message: data.message,
    status: "new",
    autoReplySent: false,
  });

  // Send auto-reply email
  const fromDomain = process.env.RESEND_DOMAIN ?? "";
  const from = fromDomain
    ? `Loctech Training Institution <hello@${fromDomain}>`
    : (process.env.EMAIL_FROM || "Loctech <noreply@loctech.com>");
  const contactEmail = process.env.EMAIL_FROM || "enquiries@loctechng.com";

  try {
    const html = await render(
      InquiryReceivedEmail({
        name: data.name,
        courseOfInterest: data.courseOfInterest || "our programs",
        contactEmail,
      })
    );

    await ResendService.sendEmail({
      from,
      to: data.email,
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
  if (filters?.status) filter.status = filters.status;

  const inquiries = await InquiryModel.find(filter)
    .sort("-createdAt")
    .lean();

  return inquiries.map((i) => ({
    id: String(i._id),
    name: i.name,
    email: i.email,
    phone: i.phone,
    courseOfInterest: i.courseOfInterest,
    message: i.message,
    status: i.status,
    autoReplySent: i.autoReplySent,
    respondedAt: i.respondedAt,
    convertedToStudentId: i.convertedToStudentId,
    createdAt: (i.createdAt as Date)?.toISOString?.(),
  }));
};

/**
 * Mark inquiry as responded
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
    status: "contacted",
    respondedAt: new Date(),
    respondedBy: session.user.id,
  });

  return { success: true };
};

/**
 * Mark inquiry as converted (email matches student)
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
    status: "converted",
    respondedAt: new Date(),
    respondedBy: session.user.id,
    convertedToStudentId: studentId,
  });

  return { success: true };
};
