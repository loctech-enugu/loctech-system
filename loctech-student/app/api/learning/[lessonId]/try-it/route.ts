import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { StudentModel } from "@/backend/models/students.model";
import { StudentLessonProgressModel } from "@/backend/models/student-lesson-progress.model";
import { EnrollmentModel } from "@/backend/models/enrollment.model";
import { ClassModel } from "@/backend/models/class.model";
import { CourseLearningModel } from "@/backend/models/course-learning.model";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const student = await StudentModel.findOne({ email: session.user.email }).lean();
    if (!student) throw new Error("Student profile not found");

    const { lessonId } = await params;
    const classId = req.nextUrl.searchParams.get("classId");
    if (!classId) throw new Error("classId is required");

    const [enrollment, classDoc, lessonDoc] = await Promise.all([
      EnrollmentModel.findOne({
        classId,
        studentId: student._id,
        status: { $in: ["active", "paused"] },
      }).lean(),
      ClassModel.findById(classId).select("courseId").lean(),
      CourseLearningModel.findById(lessonId).select("courseId").lean(),
    ]);
    if (!enrollment || !classDoc || !lessonDoc) throw new Error("Forbidden");
    if (String(classDoc.courseId) !== String(lessonDoc.courseId)) throw new Error("Forbidden");

    const progress = await StudentLessonProgressModel.findOne({
      lessonId,
      studentId: student._id,
      classId,
    }).lean();

    return NextResponse.json({
      success: true,
      data: progress
        ? {
            htmlCode: progress.htmlCode,
            cssCode: progress.cssCode,
            jsCode: progress.jsCode,
            isCompleted: progress.isCompleted,
          }
        : null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch try-it progress";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);
    if (!session) throw new Error("Unauthorized");

    const student = await StudentModel.findOne({ email: session.user.email }).lean();
    if (!student) throw new Error("Student profile not found");

    const { lessonId } = await params;
    const body = await req.json();
    const classId = body.classId;
    if (!classId) throw new Error("classId is required");

    const [enrollment, classDoc, lessonDoc] = await Promise.all([
      EnrollmentModel.findOne({
        classId,
        studentId: student._id,
        status: { $in: ["active", "paused"] },
      }).lean(),
      ClassModel.findById(classId).select("courseId").lean(),
      CourseLearningModel.findById(lessonId).select("courseId").lean(),
    ]);
    if (!enrollment || !classDoc || !lessonDoc) throw new Error("Forbidden");
    if (String(classDoc.courseId) !== String(lessonDoc.courseId)) throw new Error("Forbidden");

    await StudentLessonProgressModel.findOneAndUpdate(
      { lessonId, studentId: student._id, classId },
      {
        htmlCode: String(body.htmlCode || ""),
        cssCode: String(body.cssCode || ""),
        jsCode: String(body.jsCode || ""),
        isCompleted: Boolean(body.isCompleted),
        lastRunAt: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json({ success: true, message: "Progress saved" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save try-it progress";
    return NextResponse.json(
      { success: false, error: message },
      { status: message.includes("Forbidden") ? 403 : 500 }
    );
  }
}
