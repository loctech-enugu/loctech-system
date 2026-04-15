import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ClassModel } from "@/backend/models/class.model";
import { CourseLearningModel } from "@/backend/models/course-learning.model";
import { EnrollmentModel } from "@/backend/models/enrollment.model";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const { id } = await params;
    const classDoc = await ClassModel.findById(id).lean();
    if (!classDoc) throw new Error("Class not found");

    const enrollment = await EnrollmentModel.findOne({
      classId: id,
      studentId: session.user.id,
      status: { $in: ["active", "paused"] },
    }).lean();
    if (!enrollment) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const lessons = await CourseLearningModel.find({
      courseId: String(classDoc.courseId),
      isPublished: true,
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      data: lessons.map((l) => ({
        id: String(l._id),
        title: l.title,
        slug: l.slug,
        order: l.order,
        contentHtml: l.contentHtml,
        estimatedMinutes: l.estimatedMinutes,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch class learning";
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes("Unauthorized") ? 401 : message.includes("Forbidden") ? 403 : 500 }
    );
  }
}
