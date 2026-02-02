import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { ExamModel } from "../models/exam.model";
import { UserExamModel } from "../models/user-exam.model";

/* eslint-disable */

/**
 * Format exam document for frontend
 */
export const formatExam = (exam: Record<string, any>) => {
  const course = exam.courseId as Record<string, any> | null;

  return {
    id: String(exam._id),
    title: exam.title ?? "",
    description: exam.description ?? null,
    duration: exam.duration ?? 0,
    totalQuestions: exam.totalQuestions ?? 0,
    questionsPerStudent: exam.questionsPerStudent ?? 0,
    passingScore: exam.passingScore ?? 0,
    maxAttempts: exam.maxAttempts ?? 1,
    status: exam.status ?? "draft",
    scheduledStart: exam.scheduledStart
      ? (exam.scheduledStart as Date)?.toISOString?.()
      : null,
    expirationDate: exam.expirationDate
      ? (exam.expirationDate as Date)?.toISOString?.()
      : null,
    showCorrectAnswers: exam.showCorrectAnswers ?? false,
    showDetailedFeedback: exam.showDetailedFeedback ?? false,
    autoPublishResults: exam.autoPublishResults ?? false,
    shuffleQuestions: exam.shuffleQuestions ?? false,
    questions: (exam.questions ?? []).map((id: any) => String(id)),
    courseId: exam.courseId ? String(exam.courseId) : null,
    classIds: (exam.classIds ?? []).map((id: any) => String(id)),
    requireMinimumAttendance: exam.requireMinimumAttendance ?? false,
    minimumAttendancePercentage: exam.minimumAttendancePercentage ?? 0,
    course: course
      ? {
          id: String(course._id),
          title: course.title ?? "",
          courseRefId: course.courseRefId ?? "",
        }
      : null,
    createdAt: (exam.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (exam.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * GET INDIVIDUAL EXAM RESULT
 */
export const getExamResult = async (examId: string, userId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Students can only see their own results
  if (
    session.user.role === "student" &&
    session.user.id !== userId
  ) {
    throw new Error("Forbidden");
  }

  const exam = await ExamModel.findById(examId).lean();
  if (!exam) throw new Error("Exam not found");

  const userExam = await UserExamModel.findOne({
    examId,
    userId,
  })
    .populate("userId", "name email")
    .sort("-attemptNumber")
    .lean();

  if (!userExam) {
    throw new Error("Exam result not found");
  }

  // Get answers if result is published
  let answers = null;
  if (exam.showCorrectAnswers) {
    const { UserAnswerModel } = await import("../models/user-answer.model");
    const { QuestionModel } = await import("../models/question.model");

    const userAnswers = await UserAnswerModel.find({
      userExamId: userExam._id,
    })
      .populate("questionId")
      .lean();

    answers = userAnswers.map((ua) => ({
      questionId: String(ua.questionId),
      question: (ua.questionId as any)?.question ?? "",
      answer: ua.answer,
      correctAnswer: (ua.questionId as any)?.correctAnswer,
      isCorrect: ua.isCorrect,
      pointsEarned: ua.pointsEarned,
      explanation: (ua.questionId as any)?.explanation ?? null,
    }));
  }

  return {
    exam: formatExam(exam),
    result: {
      id: String(userExam._id),
      userId: String(userExam.userId),
      user: (userExam.userId as any)?.name
        ? {
            id: String((userExam.userId as any)._id),
            name: (userExam.userId as any).name,
            email: (userExam.userId as any).email,
          }
        : null,
      attemptNumber: userExam.attemptNumber,
      status: userExam.status,
      score: userExam.score ?? null,
      percentage: userExam.percentage ?? null,
      submittedAt: userExam.submittedAt
        ? (userExam.submittedAt as Date)?.toISOString?.()
        : null,
      timeSpent: userExam.timeSpent ?? null,
      violationCount: userExam.violationCount ?? 0,
      answers,
    },
  };
};
