import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { ClassAttendanceModel } from "../models/class-attendance.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassModel } from "../models/class.model";
import { NotificationModel } from "../models/notification.model";
import { StudentModel } from "../models/students.model";
import { ClassSessionModel } from "../models/class-session.model";
import { checkAndCreateAbsenceNotifications } from "./notifications.controller";
import { createOtp } from "@/lib/otp";
import { createQrSessionToken, getDailySecret } from "@/lib/qr";
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
 * Get UTC date key (YYYY-MM-DD)
 */
function getUtcDateKey(date = new Date()): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * GET OR CREATE TODAY'S CLASS SESSION
 */
export const getTodayClassSession = async (classId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only instructor assigned to class or admin can access
  const classItem = await ClassModel.findById(classId).lean();
  if (!classItem) throw new Error("Class not found");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    (session.user.role !== "instructor" ||
      String(classItem.instructorId) !== session.user.id)
  ) {
    throw new Error(
      "Forbidden: Only assigned instructor or admin can access class session",
    );
  }

  const dateKey = getUtcDateKey();
  const secret = getDailySecret();
  const barcodeToken = createQrSessionToken();
  const { otp: pin } = createOtp({ length: 6 });

  // Create barcode data (classId + date + secret)
  const barcode = `${classId}-${dateKey}-${barcodeToken}`;

  // Expires at end of day (23:59:59)
  const expiresAt = new Date();
  expiresAt.setUTCHours(23, 59, 59, 999);

  // Use upsert to create or get today's session
  const classSession = await ClassSessionModel.findOneAndUpdate(
    { classId, dateKey },
    {
      $setOnInsert: {
        pin,
        barcode,
        secret,
        expiresAt,
      },
    },
    { upsert: true, new: true },
  ).lean();

  return {
    classId,
    className: classItem.name,
    date: dateKey,
    pin: classSession.pin,
    barcode: classSession.barcode,
    secret: classSession.secret,
    expiresAt: classSession.expiresAt.toISOString(),
  };
};

/**
 * GENERATE PIN FOR CLASS SESSION (legacy - now uses getTodayClassSession)
 */
export const generateAttendancePIN = async (classId: string) => {
  const session = await getTodayClassSession(classId);
  return {
    pin: session.pin,
    classId: session.classId,
    className: session.className,
    expiresAt: session.expiresAt,
    generatedBy: {
      id: (await getServerSession(authConfig))?.user.id,
      name: (await getServerSession(authConfig))?.user.name,
    },
  };
};

/**
 * GENERATE BARCODE FOR CLASS SESSION (legacy - now uses getTodayClassSession)
 */
export const generateAttendanceBarcode = async (classId: string) => {
  const session = await getTodayClassSession(classId);
  return {
    barcode: session.barcode,
    classId: session.classId,
    className: session.className,
    expiresAt: session.expiresAt,
    generatedBy: {
      id: (await getServerSession(authConfig))?.user.id,
      name: (await getServerSession(authConfig))?.user.name,
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
    throw new Error(
      `Cannot record attendance: Enrollment status is ${enrollment.status}`,
    );
  }

  // Check if class is active
  const classItem = await ClassModel.findById(data.classId).lean();
  if (!classItem) throw new Error("Class not found");

  if (classItem.status !== "active") {
    throw new Error("Cannot record attendance: Class is not active");
  }

  // Verify PIN or barcode against today's class session (only for pin/barcode methods)
  if (data.method === "pin" || data.method === "barcode") {
    const dateKey = getUtcDateKey(new Date(data.date));
    const classSession = await ClassSessionModel.findOne({
      classId: data.classId,
      dateKey,
    }).lean();

    if (!classSession) {
      throw new Error(
        "No active session found for this class today. Please generate a PIN/barcode first.",
      );
    }

    // Check if session has expired
    if (new Date() > classSession.expiresAt) {
      throw new Error(
        "Session has expired. Please generate a new PIN/barcode.",
      );
    }

    // Verify PIN if provided
    if (data.method === "pin" && data.pin) {
      if (data.pin !== classSession.pin) {
        throw new Error("Invalid PIN");
      }
    }

    // Verify barcode if provided
    if (data.method === "barcode" && data.barcode) {
      // Verify barcode matches today's session
      if (data.barcode !== classSession.barcode) {
        throw new Error("Invalid barcode for this class");
      }
    }
  }
  // For manual method, no PIN/barcode verification needed (instructor/admin can sign in directly)

  // Check if attendance already exists
  // Normalize the date to start of day for consistent querying
  const targetDate = new Date(data.date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await ClassAttendanceModel.findOne({
    studentId: data.studentId,
    classId: data.classId,
    date: {
      $gte: startOfDay,
      $lte: endOfDay,
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
  // Normalize date to start of day for consistent storage
  const normalizedDate = new Date(data.date);
  normalizedDate.setHours(0, 0, 0, 0);

  const attendance = await ClassAttendanceModel.create({
    studentId: data.studentId,
    classId: data.classId,
    date: normalizedDate,
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
  classId: string,
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
      },
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
    const studentId =
      (enrollment.studentId as any)?._id || enrollment.studentId;
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

  return monitoringData.sort(
    (a, b) => b.consecutiveAbsences - a.consecutiveAbsences,
  );
};

/**
 * GET ATTENDANCE BY CLASS AND DATE
 * Returns all enrolled students with their attendance records (or null if not signed in)
 */
export const getClassAttendanceByDate = async (
  classId: string,
  date: string,
): Promise<
  {
    student: {
      id: string;
      name: string;
      email: string | null;
    };
    attendance: ReturnType<typeof formatClassAttendance> | null;
  }[]
> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Get all students enrolled in this class
  const enrollments = await EnrollmentModel.find({
    classId,
    status: { $in: ["active", "paused"] },
  })
    .populate("studentId", "name email")
    .lean();

  //eslint-disable-next-line
  const students = enrollments.map((e: any) => e.studentId).filter(Boolean);

  if (!students || students.length === 0) return [];

  // 🎯 Define date range for the specific day
  const targetDate = new Date(date);
  const startOfDay = new Date(targetDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(targetDate);
  endOfDay.setHours(23, 59, 59, 999);

  // 📜 Get attendance records for that class & date
  const attendanceRecords = await ClassAttendanceModel.find({
    classId,
    date: { $gte: startOfDay, $lte: endOfDay },
  })
    .populate("studentId", "name email")
    .populate("classId", "name courseId")
    .populate("recordedBy", "name email")
    .lean();
  console.log("attendanceRecords: ", attendanceRecords);

  // 🔄 Format all attendance records
  const formattedRecords = attendanceRecords.map((a) =>
    formatClassAttendance(a),
  );
  console.log("formattedRecords: ", formattedRecords);

  // 🧩 Combine students and their attendance record (if exists)
  const result = students.map((student: any) => {
    const record = formattedRecords.find(
      (r) => r.student?.id === String(student._id),
    );

    return {
      student: {
        id: String(student._id),
        name: student.name,
        email: student.email || null,
      },
      attendance: record || null,
    };
  });

  return result;
};

/**
 * GET CLASS ATTENDANCE BY DATE RANGE (for calendar)
 */
export const getClassAttendanceByDateRange = async (
  classId: string,
  startDate?: string,
  endDate?: string,
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = { classId };

  // Filter by date range
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter.date.$gte = start;
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.date.$lte = end;
    }
  }

  const attendance = await ClassAttendanceModel.find(filter)
    .populate("studentId", "name email")
    .populate("classId", "name courseId")
    .populate("recordedBy", "name email")
    .sort({ date: -1 })
    .lean();

  return attendance.map((a) => formatClassAttendance(a));
};

/**
 * UPDATE CLASS ATTENDANCE BY ID (for editing)
 */
export const updateAttendanceById = async (
  id: string,
  data: Record<string, unknown>,
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const record = await ClassAttendanceModel.findById(id);
  if (!record) {
    throw new Error("Attendance record not found");
  }

  // Check access - instructors can only update their own class attendance
  if (session.user.role === "instructor") {
    const classItem = await ClassModel.findById(record.classId).lean();
    if (!classItem || String(classItem.instructorId) !== session.user.id) {
      throw new Error(
        "Forbidden: You can only update attendance for your assigned classes",
      );
    }
  } else if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  // Update fields if provided
  if (data.status !== undefined) {
    record.status = data.status as typeof record.status;
  }
  if (data.recordedAt !== undefined) {
    record.recordedAt = data.recordedAt
      ? new Date(data.recordedAt as string)
      : new Date();
  }
  if (data.signInTime !== undefined && data.signInTime) {
    record.recordedAt = new Date(data.signInTime as string);
  }
  if (data.method !== undefined) {
    record.method = data.method as typeof record.method;
  }
  if (data.pin !== undefined) {
    record.pin = data.pin as string | undefined;
  }

  await record.save();

  // Update consecutive absence tracking
  await updateConsecutiveAbsences(
    String(record.studentId),
    String(record.classId),
  );

  const populated = await ClassAttendanceModel.findById(record._id)
    .populate("studentId", "name email")
    .populate("classId", "name courseId")
    .populate("recordedBy", "name email")
    .lean();

  return formatClassAttendance(populated!);
};

/**
 * GET STUDENT ATTENDANCE HISTORY
 */
export const getStudentAttendanceHistory = async (
  studentId: string,
  classId?: string,
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: { studentId: string; classId?: string } = { studentId };
  if (classId) filter.classId = classId;

  const attendance = await ClassAttendanceModel.find(filter)
    .populate("classId", "name courseId")
    .sort({ date: -1 })
    .limit(50)
    .lean();

  return attendance.map((a) => formatClassAttendance(a));
};
