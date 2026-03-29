import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { AssignmentModel } from "@/backend/models/assignment.model";
import { ClassModel } from "@/backend/models/class.model";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    if (!classId) throw new Error("classId is required");

    const classDoc = await ClassModel.findById(classId).lean();
    if (!classDoc) throw new Error("Class not found");
    const canManage =
      session.user.role === "admin" ||
      session.user.role === "super_admin" ||
      session.user.role === "staff" ||
      (session.user.role === "instructor" &&
        String(classDoc.instructorId) === session.user.id);
    if (!canManage) {
      throw new Error("Forbidden");
    }

    const assignments = await AssignmentModel.find({ classId })
      .sort("-dueDate")
      .lean();

    return successResponse(
      assignments.map((a) => ({
        id: String(a._id),
        title: a.title,
        description: a.description,
        classId: String(a.classId),
        maxScore: a.maxScore,
        dueDate: (a.dueDate as Date)?.toISOString?.(),
        createdAt: (a.createdAt as Date)?.toISOString?.(),
      }))
    );
  } catch (error) {
    console.error("Get assignments error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch assignments", 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const body = await req.json();
    const { title, description, classId, maxScore, dueDate } = body;
    if (!title || !classId || !dueDate) throw new Error("title, classId, and dueDate are required");

    const classDoc = await ClassModel.findById(classId).lean();
    if (!classDoc) throw new Error("Class not found");
    const canManage =
      session.user.role === "admin" ||
      session.user.role === "super_admin" ||
      session.user.role === "staff" ||
      (session.user.role === "instructor" &&
        String(classDoc.instructorId) === session.user.id);
    if (!canManage) {
      throw new Error("Forbidden");
    }

    const assignment = await AssignmentModel.create({
      title,
      description: description ?? "",
      classId,
      maxScore: maxScore ?? 100,
      dueDate: new Date(dueDate),
      createdBy: session.user.id,
    });

    return successResponse(
      {
        id: String(assignment._id),
        title: assignment.title,
        description: assignment.description,
        classId: String(assignment.classId),
        maxScore: assignment.maxScore,
        dueDate: (assignment.dueDate as Date)?.toISOString?.(),
      },
      "Assignment created",
      201
    );
  } catch (error) {
    console.error("Create assignment error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to create assignment", 500);
  }
}
