import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { CourseModel } from "../models/courses.model";
import { UserModel } from "../models/user.model";
import { StudentModel } from "../models/students.model";
import { Course } from "@/types";

/* eslint-disable */

interface ApiCourse {
  _id: string;
  courseRefId: string;
  title: string;
  description: string;
  amount: number;
  img: string;
  instructor: string;
  category: string;
  duration: string;
  mode: string;
  level: string;
  learning: string[];
  requirement: string[];
  overview: string;
  videoUrl: string;
  curriculum: string[];
  curriculumUrl: string;
  featured: boolean;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Format course document into frontend-friendly Course type
 */
export const formatCourse = (course: Record<string, any>): Course => {
  const instructors = (course.instructors ?? []) as Record<string, any>[];

  return {
    id: String(course._id),
    courseRefId: course.courseRefId ?? "",
    title: course.title ?? "",
    description: course.description ?? "",
    amount: course.amount ?? 0,
    img: course.img ?? null,
    category: course.category ?? null,
    duration: course.duration ?? null,
    mode: course.mode ?? null,
    level: course.level ?? null,
    learning: course.learning ?? [],
    requirement: course.requirement ?? [],
    overview: course.overview ?? null,
    videoUrl: course.videoUrl ?? null,
    curriculumUrl: course.curriculumUrl ?? null,
    featured: course.featured ?? false,
    slug: course.slug ?? "",
    isActive: course.isActive ?? true,

    instructor: null, // Deprecated - use instructors array

    instructors: instructors.map((i) => ({
      id: String(i._id),
      name: i.name ?? "",
      email: i.email ?? "",
    })),

    students: [], // Students are now enrolled via classes, not directly in courses

    createdAt: (course.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (course.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL COURSES
 */
export const getAllCourses = async (): Promise<Course[]> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);

  const filter: Record<string, any> = {};

  // Filter by instructor if user is instructor
  if (session?.user.role === "instructor") {
    filter.instructors = session.user.id;
  }

  const courses = await CourseModel.find(filter)
    .populate("instructors", "name email")
    .lean();

  return courses.map((course) => formatCourse(course));
};

/**
 * 🟦 SYNC / LOAD COURSES FROM EXTERNAL API
 */
export const loadAllCoursesFromApi = async () => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  try {
    const response = await fetch(`${process.env.COURSES_API}`, {
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch courses: ${response.statusText}`);
    }

    const data: ApiCourse[] = await response.json();

    for (const item of data) {
      await CourseModel.updateOne(
        { courseRefId: item._id },
        {
          $set: {
            title: item.title,
            description: item.description,
            amount: item.amount,
            img: item.img,
            instructors: [],
            category: item.category,
            duration: item.duration,
            mode: item.mode,
            level: item.level,
            learning: item.learning,
            requirement: item.requirement,
            overview: item.overview,
            videoUrl: item.videoUrl,
            curriculumUrl: item.curriculumUrl,
            featured: item.featured,
            slug: item.slug,
          },
        },
        { upsert: true }
      );
    }

    return { success: true, message: "Courses synced successfully" };
  } catch (error: any) {
    console.error("Error fetching or syncing courses:", error);
    throw new Error("Failed to load courses from external API");
  }
};

/**
 * 🟦 GET ONE COURSE
 */
export const getCourseById = async (id: string): Promise<Course | null> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const course = await CourseModel.findById(id)
    .populate("instructors", "name email")
    .lean();

  return course ? formatCourse(course) : null;
};

/**
 * 🟧 UPDATE COURSE
 */
export const updateCourse = async (
  id: string,
  data: Partial<Course> & { instructors?: string[] }
): Promise<Course | null> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const course = await CourseModel.findById(id);
  if (!course) throw new Error("Course not found");

  // Handle instructors if provided
  if (data.instructors !== undefined) {
    // Validate all instructors exist and are instructors
    for (const instructorId of data.instructors) {
      const instructor = await UserModel.findById(instructorId);
      if (!instructor) {
        throw new Error(`Invalid instructor ID: ${instructorId}`);
      }
      if (
        instructor.role !== "instructor" &&
        instructor.role !== "admin" &&
        instructor.role !== "super_admin"
      ) {
        throw new Error(`User ${instructorId} is not an instructor`);
      }
    }
    course.instructors = data.instructors as any;
  }

  Object.assign(course, {
    ...data,
    // Don't overwrite instructors if we already handled it above
    ...(data.instructors === undefined ? {} : { instructors: course.instructors }),
  });

  await course.save();

  const updated = await CourseModel.findById(id)
    .populate("instructors", "name email")
    .lean();

  return updated ? formatCourse(updated) : null;
};

/**
 * 🟥 DELETE COURSE
 */
export const deleteCourse = async (
  id: string
): Promise<{ success: boolean }> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const deleted = await CourseModel.findByIdAndDelete(id);
  if (!deleted) throw new Error("Course not found");

  return { success: true };
};
