import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { AssignmentGradeModel } from "@/backend/models/assignment-grade.model";
import { AssignmentModel } from "@/backend/models/assignment.model";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const { id: assignmentId } = await params;
    const assignment = await AssignmentModel.findById(assignmentId)
      .populate("classId", "instructorId")
      .lean();
    if (!assignment) throw new Error("Assignment not found");

    const classDoc = assignment.classId as unknown as { instructorId: string };
    if (
      session.user.role !== "admin" &&
      session.user.role !== "super_admin" &&
      (session.user.role !== "instructor" ||
        String(classDoc?.instructorId) !== session.user.id)
    ) {
      throw new Error("Forbidden");
    }

    const grades = await AssignmentGradeModel.find({ assignmentId })
      .populate("studentId", "name email")
      .populate("gradedBy", "name")
      .lean();

    return successResponse(
      grades.map((g) => ({
        id: String(g._id),
        studentId: String((g.studentId)?._id),
        studentName: (g.studentId as { name?: string })?.name,
        studentEmail: (g.studentId as { email?: string })?.email,
        score: g.score,
        feedback: g.feedback,
        gradedAt: (g.gradedAt as Date)?.toISOString?.(),
      }))
    );
  } catch (error) {
    console.error("Get assignment grades error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch grades", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const { id: assignmentId } = await params;
    const body = await req.json();
    const { studentId, score, feedback } = body;
    if (!studentId || score === undefined) throw new Error("studentId and score are required");

    const assignment = await AssignmentModel.findById(assignmentId)
      .populate("classId", "instructorId")
      .lean();
    if (!assignment) throw new Error("Assignment not found");

    const classDoc = assignment.classId as unknown as { instructorId: string };
    if (
      session.user.role !== "admin" &&
      session.user.role !== "super_admin" &&
      (session.user.role !== "instructor" ||
        String(classDoc?.instructorId) !== session.user.id)
    ) {
      throw new Error("Forbidden");
    }

    await AssignmentGradeModel.findOneAndUpdate(
      { assignmentId, studentId },
      {
        score: Number(score),
        feedback: feedback ?? "",
        gradedBy: session.user.id,
        gradedAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return successResponse({ success: true }, "Grade recorded");
  } catch (error) {
    console.error("Record grade error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to record grade", 500);
  }
}
