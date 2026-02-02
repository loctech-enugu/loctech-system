import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { ClassAttendanceModel } from "../models/class-attendance.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassModel } from "../models/class.model";
import { ClassSessionModel } from "../models/class-session.model";
import { createOtp } from "@/lib/otp";
import { createQrSessionToken, getDailySecret } from "@/lib/qr";
import crypto from "crypto";

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

  // Students can access class sessions for their enrolled classes
  if (session.user.role === "student") {
    const enrollment = await EnrollmentModel.findOne({
      studentId: session.user.id,
      classId,
      status: "active",
    }).lean();
    if (!enrollment) {
      throw new Error("Forbidden: You are not enrolled in this class");
    }
  }

  const dateKey = getUtcDateKey();
  const classSession = await ClassSessionModel.findOne({
    classId,
    dateKey,
  }).lean();

  if (classSession) {
    return {
      pin: classSession.pin,
      barcode: classSession.barcode,
      expiresAt: (classSession.expiresAt as Date)?.toISOString?.() ?? "",
    };
  }

  // Session doesn't exist - students cannot create sessions
  throw new Error("No active session found for this class today");
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

  // Students can only record their own attendance
  if (session.user.role === "student" && session.user.id !== data.studentId) {
    throw new Error("Forbidden: Cannot record attendance for another student");
  }

  // Check enrollment status
  const enrollment = await EnrollmentModel.findOne({
    studentId: data.studentId,
    classId: data.classId,
  }).lean();

  if (!enrollment) {
    throw new Error("Student is not enrolled in this class");
  }

  if (enrollment.status !== "active") {
    throw new Error(
      `Cannot record attendance: Enrollment status is ${enrollment.status}`
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
    const dateKey = getUtcDateKey(data.date);
    const classSession = await ClassSessionModel.findOne({
      classId: data.classId,
      dateKey,
    }).lean();

    if (!classSession) {
      throw new Error(
        "No active session found for this class today. Please generate a PIN/barcode first."
      );
    }

    // Check if session has expired
    if (new Date() > classSession.expiresAt) {
      throw new Error("Session has expired. Please generate a new PIN/barcode.");
    }

    // Verify PIN
    if (data.method === "pin" && data.pin) {
      if (classSession.pin !== data.pin) {
        throw new Error("Invalid PIN");
      }
    }

    // Verify barcode
    if (data.method === "barcode" && data.barcode) {
      if (classSession.barcode !== data.barcode) {
        throw new Error("Invalid barcode");
      }
    }
  }

  // Normalize date to start of day for consistent querying
  const normalizedDate = new Date(data.date);
  normalizedDate.setHours(0, 0, 0, 0);

  // Check if attendance already exists for this student, class, and date
  const startOfDay = new Date(normalizedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(normalizedDate);
  endOfDay.setHours(23, 59, 59, 999);

  const existing = await ClassAttendanceModel.findOne({
    studentId: data.studentId,
    classId: data.classId,
    date: { $gte: startOfDay, $lte: endOfDay },
  }).lean();

  if (existing) {
    // Update existing record
    const updated = await ClassAttendanceModel.findByIdAndUpdate(
      existing._id,
      {
        status: data.status,
        method: data.method,
        pin: data.pin || null,
        recordedAt: new Date(),
        recordedBy: session.user.id,
      },
      { new: true }
    )
      .populate("studentId", "name email")
      .populate("classId", "name courseId")
      .populate("recordedBy", "name email")
      .lean();

    return formatClassAttendance(updated!);
  }

  // Create new attendance record
  const attendance = await ClassAttendanceModel.create({
    studentId: data.studentId,
    classId: data.classId,
    date: normalizedDate,
    status: data.status,
    method: data.method,
    pin: data.pin || null,
    recordedAt: new Date(),
    recordedBy: session.user.id,
  });

  const populated = await ClassAttendanceModel.findById(attendance._id)
    .populate("studentId", "name email")
    .populate("classId", "name courseId")
    .populate("recordedBy", "name email")
    .lean();

  return formatClassAttendance(populated!);
};
