import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { ExamModel } from "../models/exam.model";
import { QuestionModel } from "../models/question.model";
import { UserExamModel } from "../models/user-exam.model";
import { CourseModel } from "../models/courses.model";
import { ClassModel } from "../models/class.model";

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
 * 🟩 GET ALL EXAMS
 */
export const getAllExams = async (filters?: {
  status?: string;
  courseId?: string;
  classId?: string;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = {};

  if (filters?.status) filter.status = filters.status;
  if (filters?.courseId) filter.courseId = filters.courseId;
  if (filters?.classId) filter.classIds = filters.classId;

  const exams = await ExamModel.find(filter)
    .populate("courseId", "title courseRefId")
    .sort("-createdAt")
    .lean();

  return exams.map((exam) => formatExam(exam));
};

/**
 * 🟦 GET ONE EXAM
 */
export const getExamById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const exam = await ExamModel.findById(id)
    .populate("courseId", "title courseRefId")
    .populate("questions", "questionText type points difficulty")
    .lean();

  if (!exam) return null;

  return formatExam(exam);
};

/**
 * 🟩 CREATE EXAM
 */
export const createExam = async (data: {
  title: string;
  description?: string;
  duration: number;
  totalQuestions: number;
  questionsPerStudent: number;
  passingScore: number;
  maxAttempts?: number;
  scheduledStart?: Date;
  expirationDate?: Date;
  showCorrectAnswers?: boolean;
  showFeedback?: boolean;
  autoPublishResults?: boolean;
  questionIds: string[];
  courseId?: string;
  classIds?: string[];
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin and super_admin can create exams
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  // Validate questions exist
  if (data.questions.length === 0) {
    throw new Error("At least one question is required");
  }

  const questions = await QuestionModel.find({
    _id: { $in: data.questions },
    isActive: true,
  });

  if (questions.length !== data.questions.length) {
    throw new Error("Some questions are invalid or inactive");
  }

  // Validate course if provided
  if (data.courseId) {
    const course = await CourseModel.findById(data.courseId);
    if (!course) throw new Error("Course not found");
  }

  // Validate classes if provided
  if (data.classIds && data.classIds.length > 0) {
    const classes = await ClassModel.find({
      _id: { $in: data.classIds },
    });
    if (classes.length !== data.classIds.length) {
      throw new Error("Some classes are invalid");
    }
  }

  // Validate questionsPerStudent <= totalQuestions
  if (data.questionsPerStudent > data.totalQuestions) {
    throw new Error(
      "Questions per student cannot exceed total questions in exam"
    );
  }

  const exam = await ExamModel.create({
    ...data,
    questions: data.questions,
    status: "draft",
    maxAttempts: data.maxAttempts ?? 1,
    showCorrectAnswers: data.showCorrectAnswers ?? false,
    showDetailedFeedback: data.showDetailedFeedback ?? false,
    autoPublishResults: data.autoPublishResults ?? false,
    shuffleQuestions: data.shuffleQuestions ?? false,
    createdBy: session.user.id,
  });

  const populated = await ExamModel.findById(exam._id)
    .populate("courseId", "title courseRefId")
    .lean();

  return formatExam(populated!);
};

/**
 * 🟧 UPDATE EXAM
 */
export const updateExam = async (
  id: string,
  data: Partial<{
    title: string;
    description: string;
    duration: number;
    totalQuestions: number;
    questionsPerStudent: number;
    passingScore: number;
    maxAttempts: number;
    scheduledStart: Date;
    expirationDate: Date;
    showCorrectAnswers: boolean;
    showFeedback: boolean;
    autoPublishResults: boolean;
    questions: string[];
    courseId: string;
    classIds: string[];
  }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const exam = await ExamModel.findById(id);
  if (!exam) throw new Error("Exam not found");

  // Cannot update published/ongoing exams (only draft)
  if (exam.status !== "draft") {
    throw new Error("Can only update draft exams");
  }

  // Validate questions if being updated
  if (data.questions) {
    const questions = await QuestionModel.find({
      _id: { $in: data.questions },
      isActive: true,
    });
    if (questions.length !== data.questions.length) {
      throw new Error("Some questions are invalid or inactive");
    }
  }

  // Validate course if being updated
  if (data.courseId) {
    const course = await CourseModel.findById(data.courseId);
    if (!course) throw new Error("Course not found");
  }

  // Validate classes if being updated
  if (data.classIds) {
    const classes = await ClassModel.find({
      _id: { $in: data.classIds },
    });
    if (classes.length !== data.classIds.length) {
      throw new Error("Some classes are invalid");
    }
  }

  Object.assign(exam, data);
  await exam.save();

  const updated = await ExamModel.findById(id)
    .populate("courseId", "title courseRefId")
    .lean();

  return formatExam(updated!);
};

/**
 * 🟥 DELETE EXAM
 */
export const deleteExam = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  // Check if exam has attempts
  const attemptCount = await UserExamModel.countDocuments({ examId: id });
  if (attemptCount > 0) {
    throw new Error(
      "Cannot delete exam with attempts. Please archive instead."
    );
  }

  const deleted = await ExamModel.findByIdAndDelete(id);
  if (!deleted) throw new Error("Exam not found");

  return { success: true };
};

/**
 * PUBLISH/UNPUBLISH EXAM
 */
export const publishExam = async (id: string, publish: boolean) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const exam = await ExamModel.findById(id);
  if (!exam) throw new Error("Exam not found");

  if (publish) {
    // Validate exam before publishing
    if (!exam.questions || exam.questions.length === 0) {
      throw new Error("Exam must have questions before publishing");
    }
    if (exam.questionsPerStudent > exam.totalQuestions && exam.questionsPerStudent > 0) {
      throw new Error("Invalid question configuration");
    }
    exam.status = "published";
  } else {
    exam.status = "draft";
  }

  await exam.save();

  return formatExam(exam.toObject());
};

/**
 * GET EXAM RESULTS
 */
export const getExamResults = async (examId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const exam = await ExamModel.findById(examId).lean();
  if (!exam) throw new Error("Exam not found");

  const userExams = await UserExamModel.find({ examId })
    .populate("userId", "name email")
    .sort("-submittedAt")
    .lean();

  return {
    exam: formatExam(exam),
    results: userExams.map((ue) => ({
      id: String(ue._id),
      userId: String(ue.userId),
      user: (ue.userId as any)?.name
        ? {
            id: String((ue.userId as any)._id),
            name: (ue.userId as any).name,
            email: (ue.userId as any).email,
          }
        : null,
      attemptNumber: ue.attemptNumber,
      status: ue.status,
      score: ue.score ?? null,
      percentage: ue.percentage ?? null,
      submittedAt: ue.submittedAt
        ? (ue.submittedAt as Date)?.toISOString?.()
        : null,
      timeSpent: ue.timeSpent ?? null,
      violationCount: ue.violationCount ?? 0,
    })),
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

  // Get answers if result is published or user is admin
  let answers = null;
  if (
    exam.showCorrectAnswers ||
    session.user.role === "admin" ||
    session.user.role === "super_admin"
  ) {
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

/**
 * PUBLISH EXAM RESULTS
 */
export const publishExamResults = async (
  examId: string,
  userIds?: string[]
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const exam = await ExamModel.findById(examId);
  if (!exam) throw new Error("Exam not found");

  // Update exam to show correct answers
  exam.showCorrectAnswers = true;
  await exam.save();

  // If specific users provided, we can mark their results as published
  // For now, we just enable showing answers for all results

  return { success: true, message: "Exam results published" };
};
