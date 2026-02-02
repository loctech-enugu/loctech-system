import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { UserExamModel } from "../models/user-exam.model";
import { ExamModel } from "../models/exam.model";
import { QuestionModel } from "../models/question.model";
import { UserAnswerModel } from "../models/user-answer.model";
import { StudentModel } from "../models/students.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassAttendanceModel } from "../models/class-attendance.model";
import { formatExam } from "./exams.controller";

/* eslint-disable */

/**
 * Format user exam document for frontend
 */
export const formatUserExam = (userExam: Record<string, any>) => {
  const exam = userExam.examId as Record<string, any> | null;
  const user = userExam.userId as Record<string, any> | null;

  return {
    id: String(userExam._id),
    userId: String(userExam.userId),
    examId: String(userExam.examId),
    attemptNumber: userExam.attemptNumber ?? 1,
    status: userExam.status ?? "NOT_STARTED",
    startTime: userExam.startTime
      ? (userExam.startTime as Date)?.toISOString?.()
      : null,
    endTime: userExam.endTime
      ? (userExam.endTime as Date)?.toISOString?.()
      : null,
    submittedAt: userExam.submittedAt
      ? (userExam.submittedAt as Date)?.toISOString?.()
      : null,
    score: userExam.score ?? null,
    percentage: userExam.percentage ?? null,
    timeSpent: userExam.timeSpent ?? null,
    violations: userExam.violations ?? [],
    violationCount: userExam.violationCount ?? 0,
    questions: (userExam.questions ?? []).map((id: any) => String(id)),
    exam: exam
      ? {
          id: String(exam._id),
          title: exam.title ?? "",
          duration: exam.duration ?? 0,
          totalQuestions: exam.totalQuestions ?? 0,
        }
      : null,
    user: user
      ? {
          id: String(user._id),
          name: user.name ?? "",
          email: user.email ?? "",
        }
      : null,
    createdAt: (userExam.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (userExam.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * GET AVAILABLE EXAMS FOR STUDENT
 */
export const getAvailableExams = async (userId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Students can only see their own available exams
  if (session.user.role === "student" && session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  const now = new Date();

  // Get published exams that are available
  const exams = await ExamModel.find({
    status: "published",
    $or: [
      { scheduledStart: { $lte: now } },
      { scheduledStart: null },
    ],
    $or: [
      { expirationDate: { $gte: now } },
      { expirationDate: null },
    ],
  })
    .populate("courseId", "title courseRefId")
    .lean();

  // Get student's enrollments
  const enrollments = await EnrollmentModel.find({
    studentId: userId,
    status: "active",
  })
    .populate("classId", "courseId")
    .lean();

  const enrolledClassIds = enrollments.map((e) => String((e.classId as any)?._id));
  const enrolledCourseIds = new Set(
    enrollments
      .map((e) => (e.classId as any)?.courseId)
      .filter(Boolean)
      .map((id: any) => String(id))
  );

  // Filter exams student can take
  const availableExams = [];

  for (const exam of exams) {
    // Check course/class eligibility
    if (exam.courseId) {
      const courseId = String(exam.courseId);
      if (!enrolledCourseIds.has(courseId)) {
        continue; // Student not enrolled in course
      }
    }

    if (exam.classIds && exam.classIds.length > 0) {
      const examClassIds = exam.classIds.map((id: any) => String(id));
      const hasMatchingClass = examClassIds.some((id) =>
        enrolledClassIds.includes(id)
      );
      if (!hasMatchingClass) {
        continue; // Student not enrolled in any assigned class
      }
    }

    // Check attendance eligibility (if exam requires minimum attendance)
    if (exam.requireMinimumAttendance && exam.minimumAttendancePercentage > 0) {
      // Get student's attendance for relevant classes
      const relevantClassIds = exam.classIds && exam.classIds.length > 0
        ? exam.classIds.map((id: any) => String(id))
        : enrolledClassIds;

      if (relevantClassIds.length > 0) {
        const totalSessions = await ClassAttendanceModel.countDocuments({
          classId: { $in: relevantClassIds },
        });

        if (totalSessions > 0) {
          const presentSessions = await ClassAttendanceModel.countDocuments({
            classId: { $in: relevantClassIds },
            studentId: userId,
            status: "present",
          });

          const attendancePercentage = (presentSessions / totalSessions) * 100;

          if (attendancePercentage < exam.minimumAttendancePercentage) {
            continue; // Student doesn't meet minimum attendance requirement
          }
        }
      }
    }

    // Check if student has reached max attempts
    const existingAttempts = await UserExamModel.find({
      examId: exam._id,
      userId,
    }).lean();

    const completedAttempts = existingAttempts.filter(
      (ea) => ea.status === "COMPLETED"
    ).length;

    if (completedAttempts >= (exam.maxAttempts ?? 1)) {
      continue; // Max attempts reached
    }

    // Check if there's an in-progress exam
    const inProgress = existingAttempts.find(
      (ea) => ea.status === "IN_PROGRESS"
    );

    availableExams.push({
      ...formatExam(exam),
      canStart: !inProgress,
      attemptsRemaining: (exam.maxAttempts ?? 1) - completedAttempts,
      inProgressExamId: inProgress ? String(inProgress._id) : null,
    });
  }

  return availableExams;
};

/**
 * START EXAM
 */
export const startExam = async (examId: string, userId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Students can only start their own exams
  if (session.user.role === "student" && session.user.id !== userId) {
    throw new Error("Forbidden");
  }

  const exam = await ExamModel.findById(examId).lean();
  if (!exam) throw new Error("Exam not found");

  if (exam.status !== "published") {
    throw new Error("Exam is not available");
  }

  // Check course/class eligibility
  if (exam.courseId) {
    const enrollments = await EnrollmentModel.find({
      studentId: userId,
      status: "active",
    })
      .populate("classId", "courseId")
      .lean();

    const enrolledCourseIds = new Set(
      enrollments
        .map((e) => (e.classId as any)?.courseId)
        .filter(Boolean)
        .map((id: any) => String(id))
    );

    if (!enrolledCourseIds.has(String(exam.courseId))) {
      throw new Error("You are not enrolled in the course for this exam");
    }
  }

  if (exam.classIds && exam.classIds.length > 0) {
    const enrollments = await EnrollmentModel.find({
      studentId: userId,
      status: "active",
    }).lean();

    const enrolledClassIds = enrollments.map((e) => String(e.classId));
    const examClassIds = exam.classIds.map((id: any) => String(id));
    const hasMatchingClass = examClassIds.some((id) =>
      enrolledClassIds.includes(id)
    );

    if (!hasMatchingClass) {
      throw new Error("You are not enrolled in any class assigned to this exam");
    }
  }

  // Check attendance eligibility (if exam requires minimum attendance)
  if (exam.requireMinimumAttendance && exam.minimumAttendancePercentage > 0) {
    const enrollments = await EnrollmentModel.find({
      studentId: userId,
      status: "active",
    }).lean();

    const relevantClassIds = exam.classIds && exam.classIds.length > 0
      ? exam.classIds.map((id: any) => String(id))
      : enrollments.map((e) => String(e.classId));

    if (relevantClassIds.length > 0) {
      const totalSessions = await ClassAttendanceModel.countDocuments({
        classId: { $in: relevantClassIds },
      });

      if (totalSessions > 0) {
        const presentSessions = await ClassAttendanceModel.countDocuments({
          classId: { $in: relevantClassIds },
          studentId: userId,
          status: "present",
        });

        const attendancePercentage = (presentSessions / totalSessions) * 100;

        if (attendancePercentage < exam.minimumAttendancePercentage) {
          throw new Error(
            `You do not meet the minimum attendance requirement of ${exam.minimumAttendancePercentage}% for this exam`
          );
        }
      }
    }
  }

  // Check if exam is scheduled
  if (exam.scheduledStart) {
    const now = new Date();
    if (now < exam.scheduledStart) {
      throw new Error("Exam has not started yet");
    }
  }

  // Check if exam has expired
  if (exam.expirationDate) {
    const now = new Date();
    if (now > exam.expirationDate) {
      throw new Error("Exam has expired");
    }
  }

  // Check max attempts
  const existingAttempts = await UserExamModel.find({
    examId,
    userId,
  }).lean();

  const completedAttempts = existingAttempts.filter(
    (ea) => ea.status === "COMPLETED"
  ).length;

  if (completedAttempts >= (exam.maxAttempts ?? 1)) {
    throw new Error("Maximum attempts reached");
  }

  // Check if there's already an in-progress exam
  const inProgress = await UserExamModel.findOne({
    examId,
    userId,
    status: "IN_PROGRESS",
  });

  if (inProgress) {
    // Return existing in-progress exam
    const populated = await UserExamModel.findById(inProgress._id)
      .populate("examId", "title duration totalQuestions")
      .populate("questions", "question type options points")
      .lean();

    return formatUserExam(populated!);
  }

  // Get next attempt number
  const attemptNumber = existingAttempts.length + 1;

  // Randomize questions if needed
  let questionIds = exam.questions;
  if (exam.questionsPerStudent > 0 && exam.questionsPerStudent < exam.totalQuestions) {
    // Shuffle and select subset
    const shuffled = [...exam.questions].sort(() => Math.random() - 0.5);
    questionIds = shuffled.slice(0, exam.questionsPerStudent);
  } else if (exam.shuffleQuestions) {
    // Shuffle all questions
    questionIds = [...exam.questions].sort(() => Math.random() - 0.5);
  }

  // Create user exam
  const userExam = await UserExamModel.create({
    userId,
    examId,
    attemptNumber,
    status: "IN_PROGRESS",
    startTime: new Date(),
    questions: questionIds,
    violations: [],
    violationCount: 0,
  });

  // Get questions for the exam
  const questions = await QuestionModel.find({
    _id: { $in: questionIds },
  })
    .select("question type options points difficulty")
    .lean();

  const populated = await UserExamModel.findById(userExam._id)
    .populate("examId", "title duration totalQuestions")
    .lean();

  return {
    ...formatUserExam(populated!),
    questions: questions.map((q) => ({
      id: String(q._id),
      question: q.question,
      type: q.type,
      options: q.options ?? [],
      points: q.points,
      difficulty: q.difficulty,
    })),
  };
};

/**
 * SUBMIT EXAM
 */
export const submitExam = async (userExamId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const userExam = await UserExamModel.findById(userExamId).lean();
  if (!userExam) throw new Error("Exam attempt not found");

  // Check ownership
  if (
    session.user.role === "student" &&
    String(userExam.userId) !== session.user.id
  ) {
    throw new Error("Forbidden");
  }

  if (userExam.status !== "IN_PROGRESS") {
    throw new Error("Exam is not in progress");
  }

  const exam = await ExamModel.findById(userExam.examId).lean();
  if (!exam) throw new Error("Exam not found");

  // Get all answers
  const answers = await UserAnswerModel.find({
    userExamId: userExam._id,
  }).lean();

  // Calculate score
  let totalScore = 0;
  let totalPoints = 0;

  for (const answer of answers) {
    totalPoints += answer.pointsEarned ?? 0;
    if (answer.isCorrect) {
      totalScore += answer.pointsEarned ?? 0;
    }
  }

  // Get total possible points
  const questions = await QuestionModel.find({
    _id: { $in: userExam.questions },
  }).lean();

  const maxPoints = questions.reduce((sum, q) => sum + (q.points ?? 1), 0);
  const percentage = maxPoints > 0 ? (totalScore / maxPoints) * 100 : 0;

  // Calculate time spent
  const startTime = userExam.startTime
    ? new Date(userExam.startTime)
    : new Date();
  const endTime = new Date();
  const timeSpent = Math.round(
    (endTime.getTime() - startTime.getTime()) / 1000 / 60
  ); // minutes

  // Update user exam
  await UserExamModel.findByIdAndUpdate(userExamId, {
    status: "COMPLETED",
    submittedAt: endTime,
    endTime: endTime,
    score: totalScore,
    percentage: percentage,
    timeSpent: timeSpent,
  });

  // Check if should auto-publish results
  if (exam.autoPublishResults) {
    await ExamModel.findByIdAndUpdate(exam._id, {
      showCorrectAnswers: true,
    });
  }

  const updated = await UserExamModel.findById(userExamId)
    .populate("examId", "title duration totalQuestions")
    .lean();

  return formatUserExam(updated!);
};

/**
 * RECORD VIOLATION
 */
export const recordViolation = async (
  userExamId: string,
  violationType: string
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const userExam = await UserExamModel.findById(userExamId);
  if (!userExam) throw new Error("Exam attempt not found");

  // Check ownership
  if (
    session.user.role === "student" &&
    String(userExam.userId) !== session.user.id
  ) {
    throw new Error("Forbidden");
  }

  if (userExam.status !== "IN_PROGRESS") {
    throw new Error("Exam is not in progress");
  }

  // Add violation
  userExam.violations.push({
    type: violationType,
    timestamp: new Date(),
  });
  userExam.violationCount = (userExam.violationCount ?? 0) + 1;

  // Check violation threshold (default: 5)
  const VIOLATION_THRESHOLD = 5;
  if (userExam.violationCount >= VIOLATION_THRESHOLD) {
    // Auto-fail and submit
    userExam.status = "CANCELLED";
    userExam.score = 0;
    userExam.percentage = 0;
    userExam.submittedAt = new Date();
    userExam.endTime = new Date();
  }

  await userExam.save();

  return {
    violationCount: userExam.violationCount,
    autoFailed: userExam.status === "CANCELLED",
  };
};

/**
 * GET USER EXAM STATUS
 */
export const getUserExamStatus = async (userExamId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const userExam = await UserExamModel.findById(userExamId)
    .populate("examId", "title duration totalQuestions")
    .lean();

  if (!userExam) throw new Error("Exam attempt not found");

  // Check ownership
  if (
    session.user.role === "student" &&
    String(userExam.userId) !== session.user.id
  ) {
    throw new Error("Forbidden");
  }

  return formatUserExam(userExam);
};
