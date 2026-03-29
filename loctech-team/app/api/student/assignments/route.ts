import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { EnrollmentModel } from "@/backend/models/enrollment.model";
import { AssignmentModel } from "@/backend/models/assignment.model";
import { AssignmentGradeModel } from "@/backend/models/assignment-grade.model";
import { ClassModel } from "@/backend/models/class.model";
import { StudentModel } from "@/backend/models/students.model";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    await connectToDatabase();

    const student = await StudentModel.findById(session.user.id).select("_id").lean();
    if (!student) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const studentId = session.user.id;
    const enrollments = await EnrollmentModel.find({
      studentId,
      status: { $in: ["active", "paused"] },
    })
      .select("classId")
      .lean();

    const classIds = enrollments.map((e) => e.classId);
    if (classIds.length === 0) {
      return NextResponse.json({ success: true, data: [] });
    }

    const assignments = await AssignmentModel.find({
      classId: { $in: classIds },
    })
      .sort({ dueDate: -1 })
      .lean();

    const assignmentIds = assignments.map((a) => a._id);
    const grades = await AssignmentGradeModel.find({
      studentId,
      assignmentId: { $in: assignmentIds },
    }).lean();

    const gradeByAssignment = new Map(
      grades.map((g) => [String(g.assignmentId), g])
    );

    const classes = await ClassModel.find({ _id: { $in: classIds } })
      .select("name")
      .lean();
    const classNameById = new Map(classes.map((c) => [String(c._id), c.name]));

    const data = assignments.map((a) => {
      const g = gradeByAssignment.get(String(a._id));
      return {
        id: String(a._id),
        title: a.title,
        description: a.description ?? "",
        classId: String(a.classId),
        className: classNameById.get(String(a.classId)) ?? "",
        maxScore: a.maxScore,
        dueDate: (a.dueDate as Date)?.toISOString?.() ?? "",
        score: g ? g.score : null,
        feedback: g?.feedback ?? null,
        gradedAt: g?.gradedAt
          ? (g.gradedAt as Date).toISOString()
          : null,
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error: unknown) {
    console.error("student assignments GET:", error);
    const msg = error instanceof Error ? error.message : "Failed to load assignments";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
