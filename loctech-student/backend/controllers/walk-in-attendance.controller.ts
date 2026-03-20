import { connectToDatabase } from "@/lib/db";
import { WalkInAttendanceModel } from "../models/walk-in-attendance.model";
import { WalkInSessionModel } from "../models/walk-in-session.model";
import { StudentModel } from "../models/students.model";

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export type WalkInBarcodeSignInResult = {
  id: string;
  message: string;
};

/**
 * Student barcode sign-in — same rules as team app: valid session barcode, one record per student per day.
 */
export async function signInWalkInWithBarcode(
  studentId: string,
  barcode: string
): Promise<WalkInBarcodeSignInResult> {
  await connectToDatabase();

  const student = await StudentModel.findById(studentId);
  if (!student) throw new Error("Student not found");

  const trimmed = String(barcode).trim();
  if (!trimmed) throw new Error("Barcode is required");

  const walkInSession = await WalkInSessionModel.findOne({
    barcode: trimmed,
    expiresAt: { $gt: new Date() },
  });
  if (!walkInSession) throw new Error("Invalid or expired barcode");

  const date = startOfToday();

  let record = await WalkInAttendanceModel.findOne({
    studentId,
    date,
  });

  if (record) {
    if (record.signOutTime) {
      throw new Error("Already signed out today. Cannot sign in again.");
    }
    record.signInTime = new Date();
    await record.save();
    return {
      id: String(record._id),
      message: "Sign-in time updated",
    };
  }

  record = await WalkInAttendanceModel.create({
    studentId,
    date,
    signInTime: new Date(),
    method: "barcode",
  });

  return {
    id: String(record._id),
    message: "Signed in successfully",
  };
}

export type StudentWalkInTodayStatus = {
  /** Signed in for today and not yet signed out */
  active: boolean;
  recordId: string | null;
  signInTime: string | null;
  signOutTime: string | null;
};

export async function getStudentWalkInTodayStatus(
  studentId: string
): Promise<StudentWalkInTodayStatus> {
  await connectToDatabase();

  const date = startOfToday();
  const record = await WalkInAttendanceModel.findOne({
    studentId,
    date,
  }).lean();

  if (!record) {
    return {
      active: false,
      recordId: null,
      signInTime: null,
      signOutTime: null,
    };
  }

  const signInTime = record.signInTime as Date | undefined;
  const signOutTime = record.signOutTime as Date | undefined;
  const active = !!signInTime && !signOutTime;

  return {
    active,
    recordId: String(record._id),
    signInTime: signInTime?.toISOString?.() ?? null,
    signOutTime: signOutTime?.toISOString?.() ?? null,
  };
}

/**
 * Student self sign-out for today's walk-in (must match session student).
 */
export async function signOutWalkInSelf(studentId: string): Promise<{ message: string }> {
  await connectToDatabase();

  const date = startOfToday();
  const record = await WalkInAttendanceModel.findOne({
    studentId,
    date,
  });

  if (!record) throw new Error("No walk-in record found for today");
  if (!record.signInTime) throw new Error("Not signed in");
  if (record.signOutTime) throw new Error("Already signed out");

  record.signOutTime = new Date();
  await record.save();

  return { message: "Signed out successfully" };
}
