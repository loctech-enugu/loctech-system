import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { ClassModel } from "../models/class.model";
import { CourseModel } from "../models/courses.model";
import { UserModel } from "../models/user.model";
import { EnrollmentModel } from "../models/enrollment.model";

/* eslint-disable */

interface ClassData {
  courseId: string;
  instructorId: string;
  name: string;
  schedule: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    timezone?: string;
  };
  capacity?: number;
  status?: "active" | "inactive" | "completed";
}

/**
 * Format class document for frontend
 */
export const formatClass = (classDoc: Record<string, any>) => {
  const course = classDoc.courseId as Record<string, any> | null;
  const instructor = classDoc.instructorId as Record<string, any> | null;

  return {
    id: String(classDoc._id),
    courseId: String(classDoc.courseId),
    instructorId: String(classDoc.instructorId),
    name: classDoc.name ?? "",
    schedule: classDoc.schedule ?? {},
    capacity: classDoc.capacity ?? null,
    status: classDoc.status ?? "active",
    course: course
      ? {
        id: String(course._id),
        title: course.title ?? "",
        courseRefId: course.courseRefId ?? "",
      }
      : null,
    instructor: instructor
      ? {
        id: String(instructor._id),
        name: instructor.name ?? "",
        email: instructor.email ?? "",
      }
      : null,
    createdAt: (classDoc.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (classDoc.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL CLASSES
 */
export const getAllClasses = async (filters?: {
  courseId?: string;
  instructorId?: string;
  status?: string;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = {};

  // Role-based filtering
  if (session.user.role === "instructor") {
    filter.instructorId = session.user.id;
  } else if (session.user.role === "staff") {
    // Staff can see classes they're assigned to (if we add that later)
    // For now, they see all classes
  }

  // Apply filters
  if (filters?.courseId) filter.courseId = filters.courseId;
  if (filters?.instructorId) filter.instructorId = filters.instructorId;
  if (filters?.status) filter.status = filters.status;

  const classes = await ClassModel.find(filter)
    .populate("courseId", "title courseRefId")
    .populate("instructorId", "name email")
    .sort("-createdAt")
    .lean();

  return classes.map((classDoc) => formatClass(classDoc));
};

/**
 * 🟦 GET ONE CLASS
 */
export const getClassById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const classDoc = await ClassModel.findById(id)
    .populate("courseId", "title courseRefId")
    .populate("instructorId", "name email")
    .lean();

  if (!classDoc) return null;

  // Check access for instructors
  const isAdmin = session.user.role === "admin" || session.user.role === 'super_admin'


  if (
    !isAdmin &&
    String(classDoc.instructorId._id) !== session.user.id
  ) {
    throw new Error("Forbidden: You can only access your assigned classes");
  }

  return formatClass(classDoc);
};

/**
 * 🟩 CREATE CLASS
 */
export const createClass = async (data: ClassData) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin and super_admin can create classes
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden: Only admins can create classes");
  }

  // Validate course exists
  const course = await CourseModel.findById(data.courseId);
  if (!course) throw new Error("Course not found");

  // Validate instructor exists and is an instructor
  const instructor = await UserModel.findById(data.instructorId);
  if (!instructor) throw new Error("Instructor not found");
  // if (instructor.role !== "instructor" && instructor.role !== "admin" && instructor.role !== "super_admin") {
  //   throw new Error("User is not an instructor");
  // }

  const newClass = await ClassModel.create({
    ...data,
    status: data.status ?? "active",
  });

  const populated = await ClassModel.findById(newClass._id)
    .populate("courseId", "title courseRefId")
    .populate("instructorId", "name email")
    .lean();

  return formatClass(populated!);
};

/**
 * 🟧 UPDATE CLASS
 */
export const updateClass = async (id: string, data: Partial<ClassData>) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const classDoc = await ClassModel.findById(id);
  if (!classDoc) throw new Error("Class not found");

  // Check access
  if (String(classDoc.instructorId) !== session.user.id) {
    throw new Error("Forbidden: You can only update your assigned classes");

  } else if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin"
  ) {
    throw new Error("Forbidden");
  }

  // Validate instructor if being changed
  if (data.instructorId) {
    const instructor = await UserModel.findById(data.instructorId);
    if (!instructor) throw new Error("Instructor not found");
  }

  // Validate course if being changed
  if (data.courseId) {
    const course = await CourseModel.findById(data.courseId);
    if (!course) throw new Error("Course not found");
  }

  Object.assign(classDoc, data);
  await classDoc.save();

  const updated = await ClassModel.findById(id)
    .populate("courseId", "title courseRefId")
    .populate("instructorId", "name email")
    .lean();

  return formatClass(updated!);
};

/**
 * 🟥 DELETE CLASS
 */
export const deleteClass = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  // Check if class has enrollments
  const enrollmentCount = await EnrollmentModel.countDocuments({ classId: id });
  if (enrollmentCount > 0) {
    throw new Error(
      "Cannot delete class with active enrollments. Please remove all enrollments first."
    );
  }

  const deleted = await ClassModel.findByIdAndDelete(id);
  if (!deleted) throw new Error("Class not found");

  return { success: true };
};

/**
 * GET CLASSES BY COURSE
 */
export const getClassesByCourse = async (courseId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const classes = await ClassModel.find({ courseId })
    .populate("courseId", "title courseRefId")
    .populate("instructorId", "name email")
    .sort("-createdAt")
    .lean();

  return classes.map((classDoc) => formatClass(classDoc));
};

/**
 * GET CLASSES BY INSTRUCTOR
 */
export const getClassesByInstructor = async (instructorId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Instructors can only see their own classes
  if (
    instructorId !== session.user.id
  ) {
    throw new Error("Forbidden");
  }

  const classes = await ClassModel.find({ instructorId })
    .populate("courseId", "title courseRefId")
    .populate("instructorId", "name email")
    .sort("-createdAt")
    .lean();

  return classes.map((classDoc) => formatClass(classDoc));
};
