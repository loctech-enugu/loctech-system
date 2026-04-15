import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { AssignmentModel } from "@/backend/models/assignment.model";
import { AssignmentGradeModel } from "@/backend/models/assignment-grade.model";
import { successResponse, errorResponse } from "@/lib/server-helper";

async function getManagedAssignment(assignmentId: string) {
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const assignment = await AssignmentModel.findById(assignmentId)
    .populate("classId", "instructorId")
    .lean();
  if (!assignment) throw new Error("Assignment not found");

  const classDoc = assignment.classId as unknown as { instructorId: string };
  const canManage =
    session.user.role === "admin" ||
    session.user.role === "super_admin" ||
    session.user.role === "staff" ||
    (session.user.role === "instructor" &&
      String(classDoc?.instructorId) === session.user.id);
  if (!canManage) throw new Error("Forbidden");

  return { assignment, session };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await getManagedAssignment(id);

    const body = await req.json();
    const update: Record<string, unknown> = {};

    if (typeof body.title === "string") update.title = body.title.trim();
    if (typeof body.description === "string") update.description = body.description.trim();
    if (body.maxScore !== undefined) update.maxScore = Number(body.maxScore);
    if (body.dueDate) update.dueDate = new Date(body.dueDate);

    const updated = await AssignmentModel.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!updated) throw new Error("Assignment not found");

    return successResponse({
      id: String(updated._id),
      title: updated.title,
      description: updated.description,
      classId: String(updated.classId),
      maxScore: updated.maxScore,
      dueDate: (updated.dueDate as Date)?.toISOString?.(),
      createdAt: (updated.createdAt as Date)?.toISOString?.(),
    });
  } catch (error) {
    console.error("Update assignment error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to update assignment", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await getManagedAssignment(id);

    await Promise.all([
      AssignmentGradeModel.deleteMany({ assignmentId: id }),
      AssignmentModel.findByIdAndDelete(id),
    ]);

    return successResponse({ success: true }, "Assignment deleted");
  } catch (error) {
    console.error("Delete assignment error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to delete assignment", 500);
  }
}
