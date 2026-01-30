import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { ClassAttendanceModel } from "../models/class-attendance.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassModel } from "../models/class.model";
import { NotificationModel } from "../models/notification.model";
import { StudentModel } from "../models/students.model";
import { checkAndCreateAbsenceNotifications } from "./notifications.controller";
import crypto from "crypto";

/* eslint-disable */

/**
 * Format class attendance document for frontend
 */
export const formatClassAttendance = (attendance: Record<string, any>) => {
  const student = attendance.studentId as Record<string, any> | null;
  const classItem = attendance.classId as Record<string, any> | null;
  const recordedBy = attendance.recordedBy as Record<string, any> | null;

  return {
    id: String(attendance._id),
    studentId: String(attendance.studentId),
    classId: String(attendance.classId),
    date: attendance.date ? (attendance.date as Date)?.toISOString?.() : null,
    status: attendance.status ?? "present",
    recordedAt: attendance.recordedAt
      ? (attendance.recordedAt as Date)?.toISOString?.()
      : null,
    method: attendance.method ?? "manual",
    pin: attendance.pin ?? null,
    student: student
      ? {
          id: String(student._id),
          name: student.name ?? "",
          email: student.email ?? "",
        }
      : null,
    class: classItem
      ? {
          id: String(classItem._id),
          name: classItem.name ?? "",
          courseId: String(classItem.courseId),
        }
      : null,
    recordedBy: recordedBy
      ? {
          id: String(recordedBy._id),
          name: recordedBy.name ?? "",
          email: recordedBy.email ?? "",
        }
      : null,
    createdAt: (attendance.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (attendance.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * GENERATE PIN FOR CLASS SESSION
 */
export const generateAttendancePIN = async (classId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only instructor assigned to class or admin can generate PIN
  const classItem = await ClassModel.findById(classId).lean();
  if (!classItem) throw new Error("Class not found");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    (session.user.role !== "instructor" ||
      String(classItem.instructorId) !== session.user.id)
  ) {
    throw new Error("Forbidden: Only assigned instructor or admin can generate PIN");
  }

  // Generate 6-digit PIN
  const pin = crypto.randomInt(100000, 999999).toString();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2); // PIN valid for 2 hours

  return {
    pin,
    classId,
    className: classItem.name,
    expiresAt: expiresAt.toISOString(),
    generatedBy: {
      id: session.user.id,
      name: session.user.name,
    },
  };
};

/**
 * GENERATE BARCODE FOR CLASS SESSION
 */
export const generateAttendanceBarcode = async (classId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only instructor assigned to class or admin can generate barcode
  const classItem = await ClassModel.findById(classId).lean();
  if (!classItem) throw new Error("Class not found");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    (session.user.role !== "instructor" ||
      String(classItem.instructorId) !== session.user.id)
  ) {
    throw new Error("Forbidden: Only assigned instructor or admin can generate barcode");
  }

  // Generate barcode data (classId + timestamp)
  const barcodeData = `${classId}-${Date.now()}`;
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 2); // Barcode valid for 2 hours

  return {
    barcode: barcodeData,
    classId,
    className: classItem.name,
    expiresAt: expiresAt.toISOString(),
    generatedBy: {
      id: session.user.id,
      name: session.user.name,
    },
  };
};

/**
 * RECORD ATTENDANCE WITH CONSTRAINTS
 */
export const recordClassAttendance = async (data: {
  studentId: string;
  classId: string;
  date: Date;
  status: "present" | "absent";
  method: "barcode" | "pin" | "manual";
  pin?: string;
  barcode?: string;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Check enrollment status
  const enrollment = await EnrollmentModel.findOne({
    studentId: data.studentId,
    classId: data.classId,
  }).lean();

  if (!enrollment) {
    throw new Error("Student is not enrolled in this class");
  }

  if (enrollment.status === "paused") {
    throw new Error("Cannot record attendance: Student enrollment is paused");
  }

  if (enrollment.status !== "active") {
    throw new Error(`Cannot record attendance: Enrollment status is ${enrollment.status}`);
  }

  // Check if class is active
  const classItem = await ClassModel.findById(data.classId).lean();
  if (!classItem) throw new Error("Class not found");

  if (classItem.status !== "active") {
    throw new Error("Cannot record attendance: Class is not active");
  }

  // Verify PIN if provided
  if (data.method === "pin" && data.pin) {
    // In a real implementation, you'd verify against a stored PIN
    // For now, we'll just check it's a valid 6-digit number
    if (!/^\d{6}$/.test(data.pin)) {
      throw new Error("Invalid PIN format");
    }
  }

  // Verify barcode if provided
  if (data.method === "barcode" && data.barcode) {
    // In a real implementation, you'd verify against a stored barcode
    // For now, we'll just check it contains the classId
    if (!data.barcode.includes(data.classId)) {
      throw new Error("Invalid barcode for this class");
    }
  }

  // Check if attendance already exists
  const existing = await ClassAttendanceModel.findOne({
    studentId: data.studentId,
    classId: data.classId,
    date: {
      $gte: new Date(data.date.setHours(0, 0, 0, 0)),
      $lt: new Date(data.date.setHours(23, 59, 59, 999)),
    },
  });

  if (existing) {
    // Update existing record
    existing.status = data.status;
    existing.method = data.method;
    existing.pin = data.pin;
    existing.recordedBy = session.user.id as any;
    existing.recordedAt = new Date();
    await existing.save();

    const populated = await ClassAttendanceModel.findById(existing._id)
      .populate("studentId", "name email")
      .populate("classId", "name courseId")
      .populate("recordedBy", "name email")
      .lean();

    // Update consecutive absence tracking
    await updateConsecutiveAbsences(data.studentId, data.classId);

    return formatClassAttendance(populated!);
  }

  // Create new attendance record
  const attendance = await ClassAttendanceModel.create({
    studentId: data.studentId,
    classId: data.classId,
    date: data.date,
    status: data.status,
    method: data.method,
    pin: data.pin,
    recordedBy: session.user.id,
    recordedAt: new Date(),
  });

  const populated = await ClassAttendanceModel.findById(attendance._id)
    .populate("studentId", "name email")
    .populate("classId", "name courseId")
    .populate("recordedBy", "name email")
    .lean();

  // Update consecutive absence tracking
  await updateConsecutiveAbsences(data.studentId, data.classId);
  
  // Check and create absence notifications (async, don't wait)
  checkAndCreateAbsenceNotifications(data.classId).catch((err) => {
    console.error("Error checking absence notifications:", err);
  });

  return formatClassAttendance(populated!);
};

/**
 * UPDATE CONSECUTIVE ABSENCE TRACKING
 */
export const updateConsecutiveAbsences = async (
  studentId: string,
  classId: string
) => {
  await connectToDatabase();

  // Get recent attendance records for this student-class pair
  const recentAttendance = await ClassAttendanceModel.find({
    studentId,
    classId,
  })
    .sort({ date: -1 })
    .limit(10)
    .lean();

  if (recentAttendance.length === 0) return;

  // Calculate consecutive absences
  let consecutiveAbsences = 0;
  for (const record of recentAttendance) {
    if (record.status === "absent") {
      consecutiveAbsences++;
    } else if (record.status === "present") {
      break; // Reset on first present
    }
  }

  // Check if we need to create/update notification
  if (consecutiveAbsences >= 2) {
    // Check if notification already exists for this streak
    const existingNotification = await NotificationModel.findOne({
      studentId,
      classId,
      type: "absence_streak",
      absenceStreak: consecutiveAbsences,
      isResolved: false,
    }).lean();

    if (!existingNotification) {
      // Create notification
      await NotificationModel.create({
        studentId,
        classId,
        type: "absence_streak",
        absenceStreak: consecutiveAbsences,
        emailSent: false,
        isResolved: false,
      });
    }
  } else {
    // Mark any existing notifications as resolved
    await NotificationModel.updateMany(
      {
        studentId,
        classId,
        type: "absence_streak",
        isResolved: false,
      },
      {
        isResolved: true,
        resolvedAt: new Date(),
      }
    );
  }
};

/**
 * GET ATTENDANCE MONITORING DATA
 */
export const getAttendanceMonitoring = async (filters?: {
  classId?: string;
  minAbsences?: number;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin and staff can view monitoring
  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  // Get all active enrollments
  const enrollmentFilter: Record<string, any> = { status: "active" };
  if (filters?.classId) {
    enrollmentFilter.classId = filters.classId;
  }

  const enrollments = await EnrollmentModel.find(enrollmentFilter)
    .populate("studentId", "name email")
    .populate("classId", "name courseId")
    .lean();

  const monitoringData = [];

  for (const enrollment of enrollments) {
    const studentId = (enrollment.studentId as any)?._id || enrollment.studentId;
    const classId = (enrollment.classId as any)?._id || enrollment.classId;

    // Get recent attendance
    const recentAttendance = await ClassAttendanceModel.find({
      studentId,
      classId,
    })
      .sort({ date: -1 })
      .limit(10)
      .lean();

    // Calculate consecutive absences
    let consecutiveAbsences = 0;
    let lastAttendanceDate: Date | null = null;

    for (const record of recentAttendance) {
      if (record.status === "absent") {
        consecutiveAbsences++;
      } else if (record.status === "present") {
        lastAttendanceDate = record.date as Date;
        break;
      }
    }

    // Get notification status
    const notification = await NotificationModel.findOne({
      studentId,
      classId,
      type: "absence_streak",
      isResolved: false,
    })
      .sort({ createdAt: -1 })
      .lean();

    if (consecutiveAbsences >= (filters?.minAbsences || 2)) {
      monitoringData.push({
        studentId: String(studentId),
        student: (enrollment.studentId as any)?.name
          ? {
              id: String((enrollment.studentId as any)._id),
              name: (enrollment.studentId as any).name,
              email: (enrollment.studentId as any).email,
            }
          : null,
        classId: String(classId),
        class: (enrollment.classId as any)?.name
          ? {
              id: String((enrollment.classId as any)._id),
              name: (enrollment.classId as any).name,
            }
          : null,
        lastAttendanceDate: lastAttendanceDate
          ? lastAttendanceDate.toISOString()
          : null,
        consecutiveAbsences,
        notificationStatus: notification
          ? {
              id: String(notification._id),
              notified: notification.emailSent,
              notifiedAt: notification.sentAt
                ? (notification.sentAt as Date).toISOString()
                : null,
            }
          : null,
      });
    }
  }

  return monitoringData.sort((a, b) => b.consecutiveAbsences - a.consecutiveAbsences);
};

/**
 * GET ATTENDANCE BY CLASS AND DATE
 */
export const getClassAttendanceByDate = async (
  classId: string,
  date: string
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
  const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

  const attendance = await ClassAttendanceModel.find({
    classId,
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("studentId", "name email")
    .populate("classId", "name courseId")
    .populate("recordedBy", "name email")
    .lean();

  return attendance.map((a) => formatClassAttendance(a));
};

/**
 * GET STUDENT ATTENDANCE HISTORY
 */
export const getStudentAttendanceHistory = async (
  studentId: string,
  classId?: string
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Students can only see their own attendance
  if (
    session.user.role === "student" &&
    session.user.id !== studentId
  ) {
    throw new Error("Forbidden");
  }

  const filter: Record<string, any> = { studentId };
  if (classId) filter.classId = classId;

  const attendance = await ClassAttendanceModel.find(filter)
    .populate("classId", "name courseId")
    .sort({ date: -1 })
    .limit(50)
    .lean();

  return attendance.map((a) => formatClassAttendance(a));
};
