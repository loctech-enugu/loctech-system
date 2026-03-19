import { NextResponse } from "next/server";
import { getStudentClassGrade } from "@/backend/controllers/grades.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";
import { EnrollmentModel } from "@/backend/models/enrollment.model";
import { ClassModel } from "@/backend/models/class.model";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const { id: studentId } = await params;

    const enrollments = await EnrollmentModel.find({
      studentId,
      status: "active",
    })
      .populate("classId", "name")
      .lean();

    const grades = await Promise.all(
      enrollments.map(async (e) => {
        const classId = String((e.classId as { _id: string })?._id ?? e.classId);
        const className = (e.classId as { name?: string })?.name ?? "";

        if (session.user.role === "student" && session.user.id !== studentId) {
          throw new Error("Forbidden");
        }

        if (session.user.role === "instructor") {
          const classDoc = await ClassModel.findById(classId).lean();
          if (!classDoc || String(classDoc.instructorId) !== session.user.id) {
            return null;
          }
        }

        const grade = await getStudentClassGrade(studentId, classId);
        return { classId, className, ...grade };
      })
    );

    const filtered = grades.filter(Boolean);
    return successResponse(filtered);
  } catch (error) {
    console.error("Get student grades error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch grades", 500);
  }
}
