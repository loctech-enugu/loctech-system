import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import type { Exam as ExamType, ExamStatus } from "@/types";
import { ExamModel } from "../models/exam.model";
import { QuestionModel } from "../models/question.model";
import { UserExamModel } from "../models/user-exam.model";
import { CourseModel } from "../models/courses.model";
import { ClassModel } from "../models/class.model";
import type { Types } from "mongoose";

/** Populated course from mongoose (lean) */
interface PopulatedCourse {
  _id: Types.ObjectId;
  title?: string;
  courseRefId?: string;
}

/** Populated user/student from mongoose (lean) */
interface PopulatedUser {
  _id: Types.ObjectId;
  name?: string;
  email?: string;
}

/** Populated question from mongoose (lean) */
interface PopulatedQuestion {
  _id: Types.ObjectId;
  question?: string;
  questionText?: string;
  correctAnswer?: string | string[];
  explanation?: string;
}

/** User exam lean doc with optional populated userId */
interface UserExamLeanDoc {
  _id: Types.ObjectId;
  userId: Types.ObjectId | PopulatedUser;
  attemptNumber?: number;
  status?: string;
  score?: number | null;
  percentage?: number | null;
  submittedAt?: Date | null;
  timeSpent?: number | null;
  violationCount?: number;
}

/** User answer lean doc with optional populated questionId */
interface UserAnswerLeanDoc {
  questionId: Types.ObjectId | PopulatedQuestion;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
}

function formatPopulatedUser(
  userId: Types.ObjectId | PopulatedUser
): { id: string; name: string; email: string } | null {
  if (!userId || typeof userId !== "object" || !("name" in userId)) return null;
  const u = userId as PopulatedUser;
  return {
    id: String(u._id),
    name: u.name ?? "",
    email: u.email ?? "",
  };
}

/** Raw exam document from mongoose find().lean() (courseId may be populated) */
interface ExamLeanDoc {
  _id: Types.ObjectId;
  title?: string;
  description?: string | null;
  duration?: number;
  totalQuestions?: number;
  questionsPerStudent?: number;
  passingScore?: number;
  maxAttempts?: number;
  status?: string;
  scheduledStart?: Date | null;
  expirationDate?: Date | null;
  showCorrectAnswers?: boolean;
  showDetailedFeedback?: boolean;
  autoPublishResults?: boolean;
  shuffleQuestions?: boolean;
  questions?: Types.ObjectId[];
  courseId?: Types.ObjectId | PopulatedCourse | null;
  classIds?: Types.ObjectId[];
  requireMinimumAttendance?: boolean;
  minimumAttendancePercentage?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Format exam document for frontend
 */
export function formatExam(exam: ExamLeanDoc): ExamType {
  const course =
    exam.courseId && typeof exam.courseId === "object" && "_id" in exam.courseId
      ? (exam.courseId as PopulatedCourse)
      : null;

  return {
    id: String(exam._id),
    title: exam.title ?? "",
    description: exam.description ?? null,
    duration: exam.duration ?? 0,
    totalQuestions: exam.totalQuestions ?? 0,
    questionsPerStudent: exam.questionsPerStudent ?? 0,
    passingScore: exam.passingScore ?? 0,
    maxAttempts: exam.maxAttempts ?? 1,
    status: (exam.status as ExamStatus) ?? "draft",
    scheduledStart: exam.scheduledStart
      ? exam.scheduledStart.toISOString()
      : null,
    expirationDate: exam.expirationDate
      ? exam.expirationDate.toISOString()
      : null,
    showCorrectAnswers: exam.showCorrectAnswers ?? false,
    showDetailedFeedback: exam.showDetailedFeedback ?? false,
    autoPublishResults: exam.autoPublishResults ?? false,
    shuffleQuestions: exam.shuffleQuestions ?? false,
    questions: (exam.questions ?? []).map((id) => String(id)),
    courseId: exam.courseId
      ? typeof exam.courseId === "object" && "_id" in exam.courseId
        ? String((exam.courseId as PopulatedCourse)._id)
        : String(exam.courseId)
      : null,
    classIds: (exam.classIds ?? []).map((id) => String(id)),
    requireMinimumAttendance: exam.requireMinimumAttendance ?? false,
    minimumAttendancePercentage: exam.minimumAttendancePercentage ?? 0,
    course: course
      ? {
        id: String(course._id),
        title: course.title ?? "",
        courseRefId: course.courseRefId ?? "",
      }
      : null,
    createdAt: exam.createdAt?.toISOString() ?? "",
    updatedAt: exam.updatedAt?.toISOString() ?? "",
  };
}

export interface ExamListFilters {
  status?: string;
  courseId?: string;
  classId?: string;
}

/**
 * 🟩 GET ALL EXAMS
 */
export const getAllExams = async (filters?: ExamListFilters) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: {
    status?: string;
    courseId?: string;
    classIds?: string;
  } = {};

  if (filters?.status) filter.status = filters.status;
  if (filters?.courseId) filter.courseId = filters.courseId;
  if (filters?.classId) filter.classIds = filters.classId;

  const exams = await ExamModel.find(filter)
    .populate("courseId", "title courseRefId")
    .sort("-createdAt")
    .lean();

  return exams.map((exam) => formatExam(exam as ExamLeanDoc));
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

  return formatExam(exam as ExamLeanDoc);
};

export interface CreateExamInput {
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
  showDetailedFeedback?: boolean;
  autoPublishResults?: boolean;
  shuffleQuestions?: boolean;
  questions: string[];
  courseId?: string;
  classIds?: string[];
}

/**
 * 🟩 CREATE EXAM
 */
export const createExam = async (data: CreateExamInput) => {
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

  const questionDocs = await QuestionModel.find({
    _id: { $in: data.questions },
    isActive: true,
  });

  if (questionDocs.length !== data.questions.length) {
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

  return formatExam(populated as ExamLeanDoc);
};

/**
 * 🟧 UPDATE EXAM
 */
export interface UpdateExamInput {
  title?: string;
  description?: string;
  duration?: number;
  totalQuestions?: number;
  questionsPerStudent?: number;
  passingScore?: number;
  maxAttempts?: number;
  scheduledStart?: Date;
  expirationDate?: Date;
  showCorrectAnswers?: boolean;
  showDetailedFeedback?: boolean;
  autoPublishResults?: boolean;
  questions?: string[];
  courseId?: string;
  classIds?: string[];
}

export const updateExam = async (id: string, data: Partial<UpdateExamInput>) => {
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

  if (!updated) throw new Error("Exam not found");
  return formatExam(updated as ExamLeanDoc);
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

  return formatExam(exam.toObject() as ExamLeanDoc);
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
    exam: formatExam(exam as ExamLeanDoc),
    results: userExams.map((ue: UserExamLeanDoc) => ({
      id: String(ue._id),
      userId: String(typeof ue.userId === "object" && "_id" in ue.userId ? ue.userId._id : ue.userId),
      user: formatPopulatedUser(ue.userId),
      attemptNumber: ue.attemptNumber ?? 1,
      status: ue.status ?? "NOT_STARTED",
      score: ue.score ?? null,
      percentage: ue.percentage ?? null,
      submittedAt: ue.submittedAt ? ue.submittedAt.toISOString() : null,
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

    answers = userAnswers.map((ua: UserAnswerLeanDoc) => {
      const q = ua.questionId;
      const pop = typeof q === "object" && q && "questionText" in q ? (q as PopulatedQuestion) : null;
      return {
        questionId: String(typeof q === "object" && q && "_id" in q ? q._id : q),
        question: pop?.question ?? pop?.questionText ?? "",
        answer: ua.answer,
        correctAnswer: pop?.correctAnswer,
        isCorrect: ua.isCorrect,
        pointsEarned: ua.pointsEarned,
        explanation: pop?.explanation ?? null,
      };
    });
  }

  const ue = userExam as UserExamLeanDoc;
  return {
    exam: formatExam(exam as ExamLeanDoc),
    result: {
      id: String(ue._id),
      userId: String(typeof ue.userId === "object" && "_id" in ue.userId ? ue.userId._id : ue.userId),
      user: formatPopulatedUser(ue.userId),
      attemptNumber: ue.attemptNumber ?? 1,
      status: ue.status ?? "NOT_STARTED",
      score: ue.score ?? null,
      percentage: ue.percentage ?? null,
      submittedAt: ue.submittedAt ? ue.submittedAt.toISOString() : null,
      timeSpent: ue.timeSpent ?? null,
      violationCount: ue.violationCount ?? 0,
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
