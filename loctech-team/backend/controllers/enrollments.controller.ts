import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassModel } from "../models/class.model";
import { StudentModel } from "../models/students.model";

/* eslint-disable */

interface EnrollmentData {
  studentId: string;
  classId: string;
  status?: "active" | "paused" | "completed" | "withdrawn";
  pauseReason?: string;
}

/**
 * Format enrollment document for frontend
 */
export const formatEnrollment = (enrollment: Record<string, any>) => {
  const student = enrollment.studentId as Record<string, any> | null;
  const classDoc = enrollment.classId as Record<string, any> | null;

  return {
    id: String(enrollment._id),
    studentId: String(enrollment.studentId),
    classId: String(enrollment.classId),
    status: enrollment.status ?? "active",
    pauseReason: enrollment.pauseReason ?? null,
    enrolledAt: (enrollment.enrolledAt as Date)?.toISOString?.() ?? "",
    pausedAt: enrollment.pausedAt
      ? (enrollment.pausedAt as Date)?.toISOString?.()
      : null,
    resumedAt: enrollment.resumedAt
      ? (enrollment.resumedAt as Date)?.toISOString?.()
      : null,
    student: student
      ? {
          id: String(student._id),
          name: student.name ?? "",
          email: student.email ?? "",
          phone: student.phone ?? null,
        }
      : null,
    class: classDoc
      ? {
          id: String(classDoc._id),
          name: classDoc.name ?? "",
          courseId: String(classDoc.courseId),
        }
      : null,
    createdAt: (enrollment.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (enrollment.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL ENROLLMENTS
 */
export const getAllEnrollments = async (filters?: {
  classId?: string;
  studentId?: string;
  status?: string;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = {};

  // Role-based filtering
  if (session.user.role === "instructor") {
    // Instructors can only see enrollments for their classes
    const instructorClasses = await ClassModel.find({
      instructorId: session.user.id,
    }).select("_id");
    const classIds = instructorClasses.map((c) => c._id);
    filter.classId = { $in: classIds };
  }

  // Apply filters
  if (filters?.classId) filter.classId = filters.classId;
  if (filters?.studentId) filter.studentId = filters.studentId;
  if (filters?.status) filter.status = filters.status;

  const enrollments = await EnrollmentModel.find(filter)
    .populate("studentId", "name email phone")
    .populate({
      path: "classId",
      populate: { path: "courseId", select: "title courseRefId" },
    })
    .sort("-createdAt")
    .lean();

  return enrollments.map((enrollment) => formatEnrollment(enrollment));
};

/**
 * 🟦 GET ONE ENROLLMENT
 */
export const getEnrollmentById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const enrollment = await EnrollmentModel.findById(id)
    .populate("studentId", "name email phone")
    .populate({
      path: "classId",
      populate: { path: "courseId", select: "title courseRefId" },
    })
    .lean();

  if (!enrollment) return null;

  // Check access for instructors
  if (session.user.role === "instructor") {
    const classDoc = await ClassModel.findById(enrollment.classId);
    if (!classDoc || String(classDoc.instructorId) !== session.user.id) {
      throw new Error("Forbidden");
    }
  }

  return formatEnrollment(enrollment);
};

/**
 * 🟩 CREATE ENROLLMENT
 */
export const createEnrollment = async (data: EnrollmentData) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin, super_admin, and staff can create enrollments
  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  // Validate student exists
  const student = await StudentModel.findById(data.studentId);
  if (!student) throw new Error("Student not found");

  // Validate class exists
  const classDoc = await ClassModel.findById(data.classId);
  if (!classDoc) throw new Error("Class not found");

  // Check if enrollment already exists
  const existing = await EnrollmentModel.findOne({
    studentId: data.studentId,
    classId: data.classId,
  });
  if (existing) {
    throw new Error("Student is already enrolled in this class");
  }

  const enrollment = await EnrollmentModel.create({
    ...data,
    status: data.status ?? "active",
    enrolledAt: new Date(),
  });

  const populated = await EnrollmentModel.findById(enrollment._id)
    .populate("studentId", "name email phone")
    .populate({
      path: "classId",
      populate: { path: "courseId", select: "title courseRefId" },
    })
    .lean();

  return formatEnrollment(populated!);
};

/**
 * 🟧 UPDATE ENROLLMENT
 */
export const updateEnrollment = async (
  id: string,
  data: Partial<EnrollmentData>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const enrollment = await EnrollmentModel.findById(id);
  if (!enrollment) throw new Error("Enrollment not found");

  // Check access
  if (session.user.role === "instructor") {
    const classDoc = await ClassModel.findById(enrollment.classId);
    if (!classDoc || String(classDoc.instructorId) !== session.user.id) {
      throw new Error("Forbidden");
    }
    // Instructors can only update status (pause/resume)
    const allowedFields = ["status", "pauseReason"];
    Object.keys(data).forEach((key) => {
      if (!allowedFields.includes(key)) {
        delete (data as any)[key];
      }
    });
  } else if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    session.user.role !== "staff"
  ) {
    throw new Error("Forbidden");
  }

  // Handle status changes
  if (data.status) {
    const oldStatus = enrollment.status;
    const newStatus = data.status;

    if (oldStatus === "active" && newStatus === "paused") {
      enrollment.pausedAt = new Date();
      enrollment.pauseReason = data.pauseReason ?? enrollment.pauseReason;
    } else if (oldStatus === "paused" && newStatus === "active") {
      enrollment.resumedAt = new Date();
      enrollment.pauseReason = undefined;
    }
  }

  Object.assign(enrollment, data);
  await enrollment.save();

  const updated = await EnrollmentModel.findById(id)
    .populate("studentId", "name email phone")
    .populate({
      path: "classId",
      populate: { path: "courseId", select: "title courseRefId" },
    })
    .lean();

  return formatEnrollment(updated!);
};

/**
 * 🟥 DELETE ENROLLMENT
 */
export const deleteEnrollment = async (id: string) => {
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

  const deleted = await EnrollmentModel.findByIdAndDelete(id);
  if (!deleted) throw new Error("Enrollment not found");

  return { success: true };
};

/**
 * GET ENROLLMENTS BY CLASS
 */
export const getEnrollmentsByClass = async (classId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Check access for instructors
  if (session.user.role === "instructor") {
    const classDoc = await ClassModel.findById(classId);
    if (!classDoc || String(classDoc.instructorId) !== session.user.id) {
      throw new Error("Forbidden");
    }
  }

  const enrollments = await EnrollmentModel.find({ classId })
    .populate("studentId", "name email phone")
    .populate({
      path: "classId",
      populate: { path: "courseId", select: "title courseRefId" },
    })
    .sort("-createdAt")
    .lean();

  return enrollments.map((enrollment) => formatEnrollment(enrollment));
};

/**
 * GET ENROLLMENTS BY STUDENT
 */
export const getEnrollmentsByStudent = async (studentId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const enrollments = await EnrollmentModel.find({ studentId })
    .populate("studentId", "name email phone")
    .populate({
      path: "classId",
      populate: [
        { path: "courseId", select: "title courseRefId" },
        { path: "instructorId", select: "name email" },
      ],
    })
    .sort("-createdAt")
    .lean();

  return enrollments.map((enrollment) => formatEnrollment(enrollment));
};

/**
 * BULK CREATE ENROLLMENTS
 */
export const bulkCreateEnrollments = async (
  studentIds: string[],
  classId: string
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

  // Validate class exists
  const classDoc = await ClassModel.findById(classId);
  if (!classDoc) throw new Error("Class not found");

  const enrollments = [];
  const errors = [];

  for (const studentId of studentIds) {
    try {
      // Check if enrollment already exists
      const existing = await EnrollmentModel.findOne({
        studentId,
        classId,
      });
      if (existing) {
        errors.push({ studentId, error: "Already enrolled" });
        continue;
      }

      const enrollment = await EnrollmentModel.create({
        studentId,
        classId,
        status: "active",
        enrolledAt: new Date(),
      });

      enrollments.push(enrollment);
    } catch (error: any) {
      errors.push({ studentId, error: error.message });
    }
  }

  return {
    success: true,
    created: enrollments.length,
    errors: errors.length > 0 ? errors : undefined,
  };
};
