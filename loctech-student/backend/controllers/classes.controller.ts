import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { ClassModel } from "../models/class.model";

/* eslint-disable */

/**
 * Format class document for frontend
 */
export const formatClass = (classDoc: Record<string, any>) => {
  const course = classDoc.courseId as Record<string, any> | null;
  const instructor = classDoc.instructorId as Record<string, any> | null;

  return {
    id: String(classDoc._id),
    name: classDoc.name ?? "",
    description: classDoc.description ?? null,
    courseId: classDoc.courseId ? String(classDoc.courseId) : null,
    instructorId: classDoc.instructorId ? String(classDoc.instructorId) : null,
    schedule: classDoc.schedule ?? null,
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
 * GET ONE CLASS
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

  // Students can view classes they're enrolled in
  // This check will be done at the API level if needed

  return formatClass(classDoc);
};
