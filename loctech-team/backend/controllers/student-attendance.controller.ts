import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { StudentModel } from "../models/students.model";
import { StudentAttendance } from "@/types";
import { StudentAttendanceModel } from "../models/students-attendance.model";
import { ClassModel } from "../models/class.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { Types } from "mongoose";

/**
 * ✅ Format Attendance Record
 */
export const formatAttendance = (
  //eslint-disable-next-line
  record: Record<string, any>
): StudentAttendance => ({
  id: String(record._id),
  student: record.student
    ? {
        id: String(record.student._id),
        name: record.student.name,
        email: record.student.email || null,
      }
    : null,
  class: record.class
    ? {
        id: String(record.class._id),
        name: record.class.name,
        courseId: String(record.class.courseId),
      }
    : null,
  staff: record.staff
    ? {
        id: String(record.staff._id),
        name: record.staff.name,
        email: record.staff.email,
      }
    : null,
  date: record.date?.toISOString(),
  status: record.status,
  signInTime: record.signInTime?.toISOString() || null,
  signOutTime: record.signOutTime?.toISOString() || null,
  notes: record.notes || "",
  createdAt: record.createdAt?.toISOString(),
  updatedAt: record.updatedAt?.toISOString(),
});

/**
 * Get All Attendance Records
 */
export const getAllStudentAttendance = async (
  class_id: string,
  startDate?: string,
  endDate?: string
): Promise<StudentAttendance[]> => {
  try {
    await connectToDatabase();

    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    // eslint-disable-next-line
    const filter: Record<string, any> = {};

    // Filter by class
    if (class_id) {
      filter.class = class_id;
    }

    // Filter by date range
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    // Staff/instructors can only view their own attendance records
    if (session.user.role === "staff" || session.user.role === "instructor") {
      filter.staff = session.user.id;
    }

    const records = await StudentAttendanceModel.find(filter)
      .populate("student", "name email")
      .populate("class", "name courseId")
      .populate("staff", "name email")
      .lean();

    return records.map(formatAttendance);
  } catch (error) {
    console.error("Error fetching student attendance:", error);
    throw new Error("Failed to fetch attendance records");
  }
};

/**
 * Get All Students in a Class with Their Attendance for a Particular Date
 */
export const getClassAttendanceByDate = async (
  class_id: string,
  date: string
): Promise<
  {
    student: {
      id: string;
      name: string;
      email: string | null;
    };
    attendance: StudentAttendance | null;
  }[]
> => {
  try {
    await connectToDatabase();

    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    // Get all students enrolled in this class
    const enrollments = await EnrollmentModel.find({
      classId: class_id,
      status: { $in: ["active", "paused"] },
    })
      .populate("studentId", "name email")
      .lean();

    //eslint-disable-next-line
    const students = enrollments.map((e: any) => e.studentId).filter(Boolean);

    if (!students || students.length === 0) return [];

    // 🎯 Define date range for the specific day
    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    // 📜 Get attendance records for that class & date
    const attendanceRecords = await StudentAttendanceModel.find({
      class: class_id,
      date: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate("student", "name email")
      .populate("class", "name courseId")
      .populate("staff", "name email")
      .lean();

    // 🔄 Format all attendance records
    const formattedRecords = attendanceRecords.map(formatAttendance);

    // 🧩 Combine students and their attendance record (if exists)
    const result = students.map((student: any) => {
      const record = formattedRecords.find(
        (r) => r.student && r.student.id === String(student._id)
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
  } catch (error) {
    console.error("Error fetching class attendance by date:", error);
    throw new Error("Failed to fetch class attendance records");
  }
};
/**
 *  Get Attendance by ID
 */
export const getAttendanceById = async (
  id: string
): Promise<StudentAttendance | null> => {
  await connectToDatabase();

  const record = await StudentAttendanceModel.findById(id)
    .populate("student", "name email")
    .populate("class", "name courseId")
    .populate("staff", "name email")
    .lean();

  return record ? formatAttendance(record) : null;
};

/**
 * Create or Sign In Attendance
 */
export const createAttendance = async (
  data: Record<string, unknown>
): Promise<StudentAttendance | null> => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const { studentId, classId, date, status, signInTime, notes } = data;

    // Check if a record already exists for this student/class/date
    let record = await StudentAttendanceModel.findOne({
      student: studentId,
      class: classId,
      date,
    });

    if (record) {
      // Already signed in — just update the existing record
      record.status = (status as typeof record.status) || record.status;
      record.signInTime =
        (signInTime ? new Date(signInTime as string) : undefined) ||
        record.signInTime ||
        new Date();
      record.notes = (notes as string) || record.notes;
      await record.save();
    } else {
      // Create new attendance record
      record = await StudentAttendanceModel.create({
        student: studentId,
        class: classId,
        date,
        status: status || "present",
        signInTime: signInTime || new Date(),
        notes,
        staff: session.user.id,
      });
    }

    const populated = await record.populate([
      { path: "student", select: "name email" },
      { path: "class", select: "name courseId" },
      { path: "staff", select: "name email" },
    ]);

    return formatAttendance(populated.toObject());
  } catch (error) {
    console.error("Error creating attendance:", error);
    throw new Error("Failed to create attendance record");
  }
};

/**
 * Update Attendance Record (Sign Out, Excuse, etc.)
 */
export const updateAttendance = async (
  data: Record<string, unknown>
): Promise<StudentAttendance | null> => {
  try {
    await connectToDatabase();

    const { studentId, classId, date, status, signOutTime, notes } = data;

    const record = await StudentAttendanceModel.findOne({
      student: studentId,
      class: classId,
      date,
    });

    if (!record) {
      throw new Error("Attendance record not found");
    }

    if (signOutTime) record.signOutTime = new Date(signOutTime as string);
    if (status) record.status = status as typeof record.status;
    if (notes) record.notes = notes as string;

    await record.save();

    const populated = await record.populate([
      { path: "student", select: "name email" },
      { path: "class", select: "name courseId" },
      { path: "staff", select: "name email" },
    ]);

    return formatAttendance(populated.toObject());
  } catch (error) {
    console.error("Error updating attendance:", error);
    throw new Error("Failed to update attendance record");
  }
};

/**
 * Update Attendance Record by ID (for editing)
 */
export const updateAttendanceById = async (
  id: string,
  data: Record<string, unknown>
): Promise<StudentAttendance | null> => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const record = await StudentAttendanceModel.findById(id);
    if (!record) {
      throw new Error("Attendance record not found");
    }

    // Update fields if provided
    if (data.status !== undefined) {
      record.status = data.status as typeof record.status;
    }
    if (data.signInTime !== undefined) {
      record.signInTime = data.signInTime
        ? new Date(data.signInTime as string)
        : undefined;
    }
    if (data.signOutTime !== undefined) {
      record.signOutTime = data.signOutTime
        ? new Date(data.signOutTime as string)
        : undefined;
    }
    if (data.notes !== undefined) {
      record.notes = data.notes as string;
    }

    await record.save();

    const populated = await record.populate([
      { path: "student", select: "name email" },
      { path: "class", select: "name courseId" },
      { path: "staff", select: "name email" },
    ]);

    return formatAttendance(populated.toObject());
  } catch (error) {
    console.error("Error updating attendance by ID:", error);
    throw new Error("Failed to update attendance record");
  }
};

/**
 * Mark Student as Signed Out
 */
export const signOutAttendance = async (
  id: string
): Promise<StudentAttendance | null> => {
  await connectToDatabase();

  const updated = await StudentAttendanceModel.findByIdAndUpdate(
    id,
    { signOutTime: new Date() },
    { new: true }
  )
    .populate("student", "name email")
    .populate("class", "name courseId")
    .populate("staff", "name email")
    .lean();

  return updated ? formatAttendance(updated) : null;
};

/**
 * ❌ Delete Attendance Record
 */
export const deleteAttendance = async (id: string): Promise<boolean> => {
  await connectToDatabase();
  const deleted = await StudentAttendanceModel.findByIdAndDelete(id);
  return !!deleted;
};
