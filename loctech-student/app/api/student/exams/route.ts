import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { ExamModel } from "@/backend/models/exam.model";
import { UserExamModel } from "@/backend/models/user-exam.model";
import { EnrollmentModel } from "@/backend/models/enrollment.model";

export async function GET(req: NextRequest) {
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

    await connectToDatabase();

    // Get student's enrolled classes
    const enrollments = await EnrollmentModel.find({
      studentId: session.user.id,
      status: "active",
    })
      .select("classId")
      .lean();

    const classIds = enrollments.map((e: any) => String(e.classId));

    // Get published exams assigned to student's classes
    const now = new Date();
    const exams = await ExamModel.find({
      status: "published",
      $or: [
        { classIds: { $in: classIds } },
        { classIds: { $size: 0 } }, // Exams assigned to all classes
      ],
      $and: [
        {
          $or: [
            { scheduledStart: { $lte: now } },
            { scheduledStart: null },
            { scheduledStart: { $exists: false } },
          ],
        },
        {
          $or: [
            { expirationDate: { $gte: now } },
            { expirationDate: null },
            { expirationDate: { $exists: false } },
          ],
        },
      ],
    })
      .populate("courseId", "title courseRefId")
      .lean();

    // Get user exam records for this student
    const userExams = await UserExamModel.find({
      userId: session.user.id,
    }).lean();

    const examMap = new Map(
      userExams.map((ue: any) => [String(ue.examId), ue])
    );

    const availableExams = exams.map((exam: any) => {
      const userExam = examMap.get(String(exam._id));
      const attempts = userExam?.attempts || 0;
      const attemptsRemaining = Math.max(0, exam.maxAttempts - attempts);
      const canStart =
        attemptsRemaining > 0 &&
        (userExam?.status === "NOT_STARTED" ||
          userExam?.status === "IN_PROGRESS" ||
          !userExam);

      return {
        id: String(exam._id),
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        totalQuestions: exam.totalQuestions,
        questionsPerStudent: exam.questionsPerStudent,
        passingScore: exam.passingScore,
        maxAttempts: exam.maxAttempts,
        attemptsRemaining,
        canStart,
        inProgressExamId: userExam?.status === "IN_PROGRESS" ? String(userExam._id) : null,
        course: exam.courseId
          ? {
            id: String(exam.courseId._id),
            title: exam.courseId.title,
          }
          : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: availableExams,
    });
  } catch (error: any) {
    console.error("Error fetching available exams:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch available exams",
      },
      { status: 500 }
    );
  }
}
