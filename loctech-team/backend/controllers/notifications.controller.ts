import { render } from "@react-email/render";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { NotificationModel } from "../models/notification.model";
import { ClassModel } from "../models/class.model";
import { StudentModel } from "../models/students.model";
import { ClassAttendanceModel } from "../models/class-attendance.model";
import { EmailLogModel } from "../models/email-log.model";
import { ResendService } from "../services/resend.service";
import { EnrollmentModel } from "../models/enrollment.model";
import AbsenceNotificationEmail from "@/emails/absence-notification";
import AtRiskNotificationEmail from "@/emails/at-risk-notification";
import { GradeConfigModel } from "../models/grade-config.model";
import { getAttendancePercentage } from "./grades.controller";
import { auditLog } from "./audit-log.controller";

/* eslint-disable */

/**
 * Format notification document for frontend
 */
export const formatNotification = (notification: Record<string, any>) => {
  const student = notification.studentId as Record<string, any> | null;
  const classDoc = notification.classId as Record<string, any> | null;
  const notifiedBy = notification.notifiedBy as Record<string, any> | null;

  return {
    id: String(notification._id),
    studentId: String(notification.studentId),
    classId: String(notification.classId),
    type: notification.type ?? "absence_streak",
    absenceStreak: notification.absenceStreak ?? 0,
    sentAt: (notification.sentAt as Date)?.toISOString?.() ?? "",
    notifiedBy: notifiedBy
      ? {
        id: String(notifiedBy._id),
        name: notifiedBy.name ?? "",
        email: notifiedBy.email ?? "",
      }
      : null,
    emailSent: notification.emailSent ?? false,
    isResolved: notification.isResolved ?? false,
    resolvedAt: notification.resolvedAt
      ? (notification.resolvedAt as Date)?.toISOString?.()
      : null,
    resolvedBy: notification.resolvedBy
      ? String(notification.resolvedBy)
      : null,
    message: notification.message ?? null,
    attendancePercentage: notification.attendancePercentage ?? null,
    gradePercentage: notification.gradePercentage ?? null,
    threshold: notification.threshold ?? null,
    student: student
      ? {
        id: String(student._id),
        name: student.name ?? "",
        email: student.email ?? "",
      }
      : null,
    class: classDoc
      ? {
        id: String(classDoc._id),
        name: classDoc.name ?? "",
      }
      : null,
    createdAt: (notification.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (notification.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL NOTIFICATIONS
 */
export const getAllNotifications = async (filters?: {
  studentId?: string;
  classId?: string;
  type?: string;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = {};

  // Role-based filtering
  if (session.user.role === "instructor") {
    // Instructors can only see notifications for their classes
    const instructorClasses = await ClassModel.find({
      instructorId: session.user.id,
    }).select("_id");
    const classIds = instructorClasses.map((c) => c._id);
    filter.classId = { $in: classIds };
  }

  // Apply filters
  if (filters?.studentId) filter.studentId = filters.studentId;
  if (filters?.classId) filter.classId = filters.classId;
  if (filters?.type) filter.type = filters.type;

  const notifications = await NotificationModel.find(filter)
    .populate("studentId", "name email")
    .populate("classId", "name")
    .populate("notifiedBy", "name email")
    .sort("-sentAt")
    .lean();

  return notifications.map((notification) => formatNotification(notification));
};

/**
 * 🟦 GET ONE NOTIFICATION
 */
export const getNotificationById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const notification = await NotificationModel.findById(id)
    .populate("studentId", "name email")
    .populate("classId", "name")
    .populate("notifiedBy", "name email")
    .lean();

  if (!notification) return null;

  // Check access for instructors
  if (session.user.role === "instructor") {
    const classDoc = await ClassModel.findById(notification.classId);
    if (!classDoc || String(classDoc.instructorId) !== session.user.id) {
      throw new Error("Forbidden");
    }
  }

  return formatNotification(notification);
};

/**
 * 🟩 CREATE NOTIFICATION (usually automated)
 */
export const createNotification = async (data: {
  studentId: string;
  classId: string;
  type?: "absence_streak" | "enrollment_paused" | "exam_reminder" | "at_risk_attendance" | "at_risk_grade";
  absenceStreak?: number;
  attendancePercentage?: number;
  gradePercentage?: number;
  threshold?: number;
  notifiedBy?: string;
  message?: string;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Validate student exists
  const student = await StudentModel.findById(data.studentId);
  if (!student) throw new Error("Student not found");

  // Validate class exists
  const classDoc = await ClassModel.findById(data.classId);
  if (!classDoc) throw new Error("Class not found");

  const notification = await NotificationModel.create({
    studentId: data.studentId,
    classId: data.classId,
    type: data.type ?? "absence_streak",
    absenceStreak: data.absenceStreak ?? 0,
    attendancePercentage: data.attendancePercentage,
    gradePercentage: data.gradePercentage,
    threshold: data.threshold,
    notifiedBy: data.notifiedBy ? (data.notifiedBy as unknown) : undefined,
    message: data.message,
    sentAt: new Date(),
    emailSent: false,
    isResolved: false,
  });

  const populated = await NotificationModel.findById(notification._id)
    .populate("studentId", "name email")
    .populate("classId", "name")
    .populate("notifiedBy", "name email")
    .lean();

  await auditLog(session, {
    action: "create",
    resource: "notification",
    resourceId: String(notification._id),
    details: {
      type: notification.type,
      studentId: data.studentId,
      classId: data.classId,
    },
  });

  return formatNotification(populated!);
};

/**
 * SEND ABSENCE NOTIFICATION EMAIL
 */
export const sendAbsenceNotification = async (notificationId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin, super_admin, and staff can send notifications
  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  const notification = await NotificationModel.findById(notificationId)
    .populate("studentId", "name email")
    .populate("classId", "name")
    .lean();

  if (!notification) throw new Error("Notification not found");

  if (notification.emailSent) {
    throw new Error("Notification email already sent");
  }

  const student = notification.studentId as Record<string, any>;
  const classDoc = notification.classId as Record<string, any>;

  const studentName = student.name ?? "Student";
  const className = classDoc.name ?? "your class";
  const absenceStreak = notification.absenceStreak ?? 2;

  // Render email using React template
  const html = await render(
    AbsenceNotificationEmail({
      studentName,
      className,
      absenceStreak,
      contactEmail:
        process.env.ABSENCE_HOLD_EMAIL || "loctechenugu@gmail.com",
    })
  );

  const subject = `Attendance Alert - ${studentName}`;

  try {
    if (!student.email) {
      throw new Error("Student email not found");
    }

    const fromDomain = process.env.RESEND_DOMAIN ?? "";
    const from = fromDomain ? `Loctech Training Institution <hello@${fromDomain}>` : (process.env.EMAIL_FROM || "Loctech <noreply@loctech.com>");

    await ResendService.sendEmail({
      from,
      to: student.email,
      subject,
      html,
    });

    // Log email
    await EmailLogModel.create({
      recipientEmail: student.email,
      subject,
      body: html,
      status: "sent",
      sentAt: new Date(),
    });

    // Update notification
    await NotificationModel.findByIdAndUpdate(notificationId, {
      emailSent: true,
      sentAt: new Date(),
      notifiedBy: session.user.id,
    });

    await auditLog(session, {
      action: "update",
      resource: "notification",
      resourceId: notificationId,
      details: { kind: "absence_email_sent", studentId: String(student._id) },
    });

    return { success: true, message: "Notification email sent" };
  } catch (error: any) {
    // Log failed email
    await EmailLogModel.create({
      recipientEmail: student.email ?? "",
      subject,
      body: html,
      status: "failed",
      errorMessage: error.message,
    });

    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * AUTOMATED ABSENCE NOTIFICATION CHECKER
 * This should be called periodically (e.g., via cron job) or after attendance is recorded
 */
export const checkAndCreateAbsenceNotifications = async (
  classId?: string
) => {
  await connectToDatabase();

  const enrollmentFilter: Record<string, any> = { status: "active" };
  if (classId) {
    enrollmentFilter.classId = classId;
  }

  // Get all active enrollments
  const enrollments = await EnrollmentModel.find(enrollmentFilter).lean();

  for (const enrollment of enrollments) {
    const studentId = (enrollment as any).studentId;
    const classIdForEnrollment = (enrollment as any).classId;

    // Get recent attendance records to check consecutive absences
    const recentAttendance = await ClassAttendanceModel.find({
      studentId: studentId,
      classId: classIdForEnrollment,
    })
      .sort("-date")
      .limit(5)
      .lean();

    if (recentAttendance.length === 0) continue;

    // Check for consecutive absences
    let consecutiveAbsences = 0;
    for (const att of recentAttendance) {
      if (att.status === "absent") {
        consecutiveAbsences++;
      } else if (att.status === "present") {
        break; // Reset on first present
      }
    }

    // If 2 or more consecutive absences, check if notification already exists
    if (consecutiveAbsences >= 2) {
      const existingNotification = await NotificationModel.findOne({
        studentId: studentId,
        classId: classIdForEnrollment,
        type: "absence_streak",
        absenceStreak: consecutiveAbsences,
        isResolved: false,
      });

      if (!existingNotification) {
        // Create new notification (system-generated, no notifiedBy)
        await NotificationModel.create({
          studentId: studentId,
          classId: classIdForEnrollment,
          type: "absence_streak",
          absenceStreak: consecutiveAbsences,
          emailSent: false,
          isResolved: false,
        });
      }
    } else {
      // Mark any existing notifications as resolved if student attended
      await NotificationModel.updateMany(
        {
          studentId: studentId,
          classId: classIdForEnrollment,
          type: "absence_streak",
          isResolved: false,
        },
        {
          isResolved: true,
          resolvedAt: new Date(),
        }
      );
    }
  }
};

/**
 * SEND AUTOMATED ABSENCE NOTIFICATIONS
 * Sends emails for all pending absence notifications
 */
export const sendAutomatedAbsenceNotifications = async () => {
  await connectToDatabase();

  // Get all unresolved notifications that haven't been emailed
  const notifications = await NotificationModel.find({
    type: "absence_streak",
    emailSent: false,
    isResolved: false,
    absenceStreak: { $gte: 2 },
  })
    .populate("studentId", "name email")
    .populate("classId", "name")
    .lean();

  const results = {
    sent: 0,
    failed: 0,
    errors: [] as string[],
  };

  for (const notification of notifications) {
    try {
      await sendAbsenceNotification(String(notification._id));
      results.sent++;
    } catch (error: any) {
      results.failed++;
      results.errors.push(
        `Notification ${notification._id}: ${error.message}`
      );
    }
  }

  return results;
};

/**
 * GET NOTIFICATIONS REQUIRING ACTION
 */
export const getNotificationsRequiringAction = async () => {
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

  const filter: Record<string, unknown> = {
    type: { $in: ["absence_streak", "at_risk_attendance", "at_risk_grade"] },
    emailSent: false,
    isResolved: false,
  };

  const notifications = await NotificationModel.find(filter)
    .populate("studentId", "name email")
    .populate("classId", "name")
    .populate("notifiedBy", "name email")
    .sort("-sentAt")
    .lean();

  return notifications.map((notification) => formatNotification(notification));
};

export const sendAtRiskNotification = async (notificationId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");
  if (session.user.role !== "admin" && session.user.role !== "super_admin" && session.user.role !== "staff") {
    throw new Error("Forbidden");
  }
  const notification = await NotificationModel.findById(notificationId)
    .populate("studentId", "name email")
    .populate("classId", "name")
    .lean();
  if (!notification) throw new Error("Notification not found");
  if (notification.type !== "at_risk_attendance" && notification.type !== "at_risk_grade") {
    throw new Error("Not an at-risk notification");
  }
  if (notification.emailSent) throw new Error("Notification email already sent");
  const student = notification.studentId as Record<string, any>;
  const classDoc = notification.classId as Record<string, any>;
  const reason = notification.type === "at_risk_attendance" ? "attendance" : "grade";
  const html = await render(
    AtRiskNotificationEmail({
      studentName: (student.name as string) ?? "Student",
      className: (classDoc.name as string) ?? "your class",
      reason,
      attendancePercentage: notification.attendancePercentage ?? 0,
      gradePercentage: notification.gradePercentage ?? 0,
      threshold: notification.threshold ?? 70,
      contactEmail: process.env.EMAIL_FROM || "enquiries@loctechng.com",
    })
  );
  const subject = `At-Risk Alert - ${student.name ?? "Student"}`;
  const fromDomain = process.env.RESEND_DOMAIN ?? "";
  const from = fromDomain ? `Loctech Training Institution <hello@${fromDomain}>` : (process.env.EMAIL_FROM || "Loctech <noreply@loctech.com>");
  try {
    if (!student.email) throw new Error("Student email not found");
    await ResendService.sendEmail({ from, to: student.email as string, subject, html });
    await EmailLogModel.create({ recipientEmail: student.email as string, subject, body: html, status: "sent", sentAt: new Date() });
    await NotificationModel.findByIdAndUpdate(notificationId, { emailSent: true, sentAt: new Date(), notifiedBy: session.user.id });
    await auditLog(session, {
      action: "update",
      resource: "notification",
      resourceId: notificationId,
      details: {
        kind: "at_risk_email_sent",
        type: notification.type,
        studentId: String(student._id),
      },
    });
    return { success: true, message: "At-risk notification email sent" };
  } catch (error: unknown) {
    await EmailLogModel.create({
      recipientEmail: (student.email as string) ?? "",
      subject,
      body: html,
      status: "failed",
      errorMessage: error instanceof Error ? error.message : String(error),
    });
    throw new Error(`Failed to send email: ${error instanceof Error ? error.message : String(error)}`);
  }
};

interface EnrollmentLean {
  studentId: unknown;
  classId: unknown;
}

interface GradeConfigLean {
  attendanceThreshold?: number;
  passingScore?: number;
}

export const checkAndCreateAtRiskNotifications = async (classId?: string): Promise<void> => {
  await connectToDatabase();
  const enrollmentFilter: { status: string; classId?: string } = { status: "active" };
  if (classId) enrollmentFilter.classId = classId;
  const enrollments = await EnrollmentModel.find(enrollmentFilter).lean();
  for (const enrollment of enrollments as EnrollmentLean[]) {
    const studentId = String(enrollment.studentId);
    const classIdForEnrollment = String(enrollment.classId);
    const config = await GradeConfigModel.findOne({
      $or: [{ classId: classIdForEnrollment }, { isGlobal: true }],
    }).lean();
    const configTyped = config as GradeConfigLean | null;
    const threshold = configTyped?.attendanceThreshold ?? 70;
    const passingScore = configTyped?.passingScore ?? 60;
    const attendancePct = await getAttendancePercentage(studentId, classIdForEnrollment);
    if (attendancePct < threshold && attendancePct > 0) {
      const existing = await NotificationModel.findOne({ studentId, classId: classIdForEnrollment, type: "at_risk_attendance", isResolved: false });
      if (!existing) {
        await NotificationModel.create({ studentId, classId: classIdForEnrollment, type: "at_risk_attendance", attendancePercentage: attendancePct, threshold, emailSent: false, isResolved: false });
      }
    } else if (attendancePct >= threshold) {
      await NotificationModel.updateMany({ studentId, classId: classIdForEnrollment, type: "at_risk_attendance", isResolved: false }, { isResolved: true, resolvedAt: new Date() });
    }
    const { getStudentClassGrade } = await import("./grades.controller");
    const gradeData = await getStudentClassGrade(studentId, classIdForEnrollment);
    if (gradeData.overallGrade < passingScore && gradeData.examAttempts > 0) {
      const existing = await NotificationModel.findOne({ studentId, classId: classIdForEnrollment, type: "at_risk_grade", isResolved: false });
      if (!existing) {
        await NotificationModel.create({ studentId, classId: classIdForEnrollment, type: "at_risk_grade", gradePercentage: gradeData.overallGrade, threshold: passingScore, emailSent: false, isResolved: false });
      }
    } else if (gradeData.overallGrade >= passingScore) {
      await NotificationModel.updateMany({ studentId, classId: classIdForEnrollment, type: "at_risk_grade", isResolved: false }, { isResolved: true, resolvedAt: new Date() });
    }
  }
};
