import crypto from "crypto";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { WalkInAttendanceModel } from "../models/walk-in-attendance.model";
import { WalkInSessionModel } from "../models/walk-in-session.model";
import { StudentModel } from "../models/students.model";
import type {
  WalkInSignedInRecord,
  WalkInSession,
  WalkInStudentSearchResult,
  WalkInSignInResult,
} from "@/types/walkin-attendance";
import { auditLog } from "./audit-log.controller";

/**
 * Create new walk-in session (invalidates all previous sessions)
 */
export const createWalkInSession = async () => {
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

  // Expire all existing sessions
  await WalkInSessionModel.updateMany(
    {},
    { $set: { expiresAt: new Date(0) } }
  );

  const barcodeToken = crypto.randomBytes(16).toString("hex");
  const secret = crypto.randomBytes(32).toString("hex");
  const barcode = `walkin-${barcodeToken}`;
  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + 1); // one month from now

  const doc = await WalkInSessionModel.create({
    barcode,
    secret,
    expiresAt,
    createdBy: session.user.id,
  });

  await auditLog(session, {
    action: "create",
    resource: "walk_in_session",
    resourceId: String(doc._id),
    details: { barcode },
  });

  return { barcode, expiresAt } satisfies { barcode: string; expiresAt: Date };
};

/**
 * Get current active walk-in session
 */
export const getActiveWalkInSession = async (): Promise<WalkInSession | null> => {
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

  const active = await WalkInSessionModel.findOne({
    expiresAt: { $gt: new Date() },
  })
    .sort("-createdAt")
    .lean();

  return active
    ? { barcode: active.barcode, expiresAt: active.expiresAt }
    : null;
};

/**
 * Sign in - staff assisted or barcode
 * For barcode: no auth required (student app passes studentId).
 * For staff_assisted: requires staff/admin session.
 */
export const signInWalkIn = async (data: {
  studentId: string;
  date?: Date;
  method: "staff_assisted" | "barcode";
  barcode?: string;
  notes?: string;
}): Promise<WalkInSignInResult> => {
  await connectToDatabase();

  const student = await StudentModel.findById(data.studentId);
  if (!student) throw new Error("Student not found");

  let actorSession: Session | null = null;

  if (data.method === "barcode") {
    if (!data.barcode) throw new Error("Barcode required");
    const walkInSession = await WalkInSessionModel.findOne({
      barcode: data.barcode,
      expiresAt: { $gt: new Date() },
    });
    if (!walkInSession) throw new Error("Invalid or expired barcode");
    // Student signs themselves in - no recordedBy
  } else {
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");
    if (
      session.user.role !== "admin" &&
      session.user.role !== "super_admin" &&
      session.user.role !== "staff"
    ) {
      throw new Error("Forbidden");
    }
    actorSession = session;
  }

  const date = data.date ? new Date(data.date) : new Date();
  date.setHours(0, 0, 0, 0);

  let record = await WalkInAttendanceModel.findOne({
    studentId: data.studentId,
    date,
  });

  if (record) {
    if (record.signOutTime) {
      throw new Error("Already signed out today. Cannot sign in again.");
    }
    // Update signInTime to current time
    record.signInTime = new Date();
    await record.save();
    if (actorSession) {
      await auditLog(actorSession, {
        action: "update",
        resource: "walk_in_attendance",
        resourceId: String(record._id),
        details: { studentId: data.studentId, method: data.method },
      });
    }
    return {
      id: String(record._id),
      message: "Sign-in time updated",
    };
  }

  const staffSession = data.method === "staff_assisted" ? actorSession : null;
  record = await WalkInAttendanceModel.create({
    studentId: data.studentId,
    date,
    signInTime: new Date(),
    method: data.method,
    recordedBy: staffSession ? staffSession.user.id : undefined,
    notes: data.notes,
  });

  if (actorSession) {
    await auditLog(actorSession, {
      action: "create",
      resource: "walk_in_attendance",
      resourceId: String(record._id),
      details: { studentId: data.studentId, method: data.method },
    });
  }

  return {
    id: String(record._id),
    message: "Signed in successfully",
  };
};

/**
 * Sign out
 */
export const signOutWalkIn = async (data: {
  studentId?: string;
  date?: Date;
  recordId?: string;
}) => {
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

  let record;
  if (data.recordId) {
    record = await WalkInAttendanceModel.findById(data.recordId);
  } else {
    if (!data.studentId) {
      throw new Error("studentId is required when recordId is not provided");
    }
    const date = data.date ? new Date(data.date) : new Date();
    date.setHours(0, 0, 0, 0);
    record = await WalkInAttendanceModel.findOne({
      studentId: data.studentId,
      date,
    });
  }

  if (!record) throw new Error("Record not found");
  if (record.signOutTime) throw new Error("Already signed out");

  record.signOutTime = new Date();
  await record.save();

  await auditLog(session, {
    action: "update",
    resource: "walk_in_attendance",
    resourceId: String(record._id),
    details: { kind: "sign_out", studentId: String(record.studentId) },
  });

  return { message: "Signed out successfully" };
};

/**
 * Get list of signed-in students for a date (includes both currently in and signed out)
 */
export const getSignedInStudents = async (date?: Date): Promise<WalkInSignedInRecord[]> => {
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

  const targetDate = date ? new Date(date) : new Date();
  targetDate.setHours(0, 0, 0, 0);
  const nextDay = new Date(targetDate);
  nextDay.setDate(nextDay.getDate() + 1);

  const records = await WalkInAttendanceModel.find({
    date: { $gte: targetDate, $lt: nextDay }
  })
    .populate("studentId", "name email")
    .sort("signInTime")
    .lean();

  return records.map((r) => ({
    id: String(r._id),
    studentId: String(r.studentId),
    studentName: (r.studentId as { name?: string })?.name,
    studentEmail: (r.studentId as { email?: string })?.email,
    signInTime: (r.signInTime as Date)?.toISOString?.() ?? null,
    signOutTime: (r.signOutTime as Date)?.toISOString?.() ?? null,
    method: r.method,
  }));
};

/**
 * Record walk-in (staff-assisted) - alias for signInWalkIn
 */
export const recordWalkInAttendance = async (data: {
  studentId: string;
  date?: Date;
  notes?: string;
}) => {
  return signInWalkIn({
    studentId: data.studentId,
    date: data.date,
    method: "staff_assisted",
    notes: data.notes,
  });
};

/**
 * Search students by name or ID (for front desk)
 */
export const searchStudentsForWalkIn = async (query: string): Promise<WalkInStudentSearchResult[]> => {
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

  const orConditions: Record<string, unknown>[] = [
    { name: { $regex: query, $options: "i" } },
    { email: { $regex: query, $options: "i" } },
  ];
  if (query.length === 24 && /^[a-f0-9]{24}$/i.test(query)) {
    orConditions.push({ _id: query });
  }

  const students = await StudentModel.find({
    status: "active",
    $or: orConditions,
  })
    .select("_id name email")
    .limit(20)
    .lean();

  return students.map((s) => ({
    id: String(s._id),
    name: s.name,
    email: s.email,
  }));
};
