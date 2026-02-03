import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ClassModel } from "@/backend/models/class.model";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Only instructors can access this
    if (session.user.role !== "instructor") {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    await connectToDatabase();

    const classes = await ClassModel.find({
      instructorId: session.user.id,
      status: { $in: ["active", "inactive"] },
    })
      .populate("courseId", "title courseRefId")
      .populate("instructorId", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const formattedClasses = classes.map((classItem: any) => ({
      id: String(classItem._id),
      courseId: String(classItem.courseId?._id || classItem.courseId),
      instructorId: String(classItem.instructorId?._id || classItem.instructorId),
      name: classItem.name,
      schedule: classItem.schedule,
      capacity: classItem.capacity,
      status: classItem.status,
      course: classItem.courseId
        ? {
          id: String(classItem.courseId._id),
          title: classItem.courseId.title,
          courseRefId: classItem.courseId.courseRefId,
        }
        : null,
      instructor: classItem.instructorId
        ? {
          id: String(classItem.instructorId._id),
          name: classItem.instructorId.name,
          email: classItem.instructorId.email,
        }
        : null,
      createdAt: (classItem.createdAt as Date)?.toISOString?.() ?? "",
      updatedAt: (classItem.updatedAt as Date)?.toISOString?.() ?? "",
    }));

    return NextResponse.json({
      success: true,
      data: formattedClasses,
    });
  } catch (error: unknown) {
    console.error("Error fetching instructor classes:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch classes";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
