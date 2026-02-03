import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { UserAnswerModel } from "../models/user-answer.model";
import { UserExamModel } from "../models/user-exam.model";
import { QuestionModel } from "../models/question.model";

/* eslint-disable */

/**
 * Format user answer document for frontend
 */
export const formatUserAnswer = (answer: Record<string, any>) => {
  const question = answer.questionId as Record<string, any> | null;

  return {
    id: String(answer._id),
    userExamId: String(answer.userExamId),
    questionId: String(answer.questionId),
    answer: answer.answer,
    isCorrect: answer.isCorrect ?? false,
    pointsEarned: answer.pointsEarned ?? 0,
    timeSpent: answer.timeSpent ?? 0,
    question: question
      ? {
          id: String(question._id),
          question: question.question ?? "",
          type: question.type ?? "",
          options: question.options ?? [],
          correctAnswer: question.correctAnswer,
          points: question.points ?? 1,
        }
      : null,
    createdAt: (answer.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (answer.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * SAVE ANSWER
 */
export const saveAnswer = async (data: {
  userExamId: string;
  questionId: string;
  answer: string | string[];
  timeSpent?: number;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Get user exam
  const userExam = await UserExamModel.findById(data.userExamId).lean();
  if (!userExam) throw new Error("Exam attempt not found");

  if (userExam.status !== "IN_PROGRESS") {
    throw new Error("Exam is not in progress");
  }

  // Get question
  const question = await QuestionModel.findById(data.questionId).lean();
  if (!question) throw new Error("Question not found");

  // Check if question is in exam
  if (!userExam.questions.includes(data.questionId as any)) {
    throw new Error("Question is not part of this exam");
  }

  // Check answer correctness
  let isCorrect = false;
  let pointsEarned = 0;

  if (question.type === "mcq" || question.type === "true_false") {
    isCorrect =
      String(question.correctAnswer).toLowerCase().trim() ===
      String(data.answer).toLowerCase().trim();
  } else if (question.type === "fill_blank") {
    isCorrect =
      String(question.correctAnswer).toLowerCase().trim() ===
      String(data.answer).toLowerCase().trim();
  } else if (question.type === "matching") {
    // For matching, compare arrays
    const correct = Array.isArray(question.correctAnswer)
      ? question.correctAnswer
      : [question.correctAnswer];
    const provided = Array.isArray(data.answer) ? data.answer : [data.answer];
    isCorrect =
      correct.length === provided.length &&
      correct.every((val, idx) => String(val).toLowerCase() === String(provided[idx]).toLowerCase());
  } else if (question.type === "essay") {
    // Essays are not auto-graded, default to false
    isCorrect = false;
  }

  if (isCorrect) {
    pointsEarned = question.points ?? 1;
  }

  // Save or update answer
  const existingAnswer = await UserAnswerModel.findOne({
    userExamId: data.userExamId,
    questionId: data.questionId,
  });

  if (existingAnswer) {
    existingAnswer.answer = data.answer;
    existingAnswer.isCorrect = isCorrect;
    existingAnswer.pointsEarned = pointsEarned;
    existingAnswer.timeSpent = data.timeSpent ?? existingAnswer.timeSpent;
    await existingAnswer.save();
    return formatUserAnswer(existingAnswer.toObject());
  } else {
    const newAnswer = await UserAnswerModel.create({
      userExamId: data.userExamId,
      questionId: data.questionId,
      answer: data.answer,
      isCorrect: isCorrect,
      pointsEarned: pointsEarned,
      timeSpent: data.timeSpent ?? 0,
    });
    return formatUserAnswer(newAnswer.toObject());
  }
};

/**
 * GET ANSWERS FOR USER EXAM
 */
export const getAnswersForUserExam = async (userExamId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const userExam = await UserExamModel.findById(userExamId).lean();
  if (!userExam) throw new Error("Exam attempt not found");

  const answers = await UserAnswerModel.find({
    userExamId: userExamId,
  })
    .populate("questionId", "question type options correctAnswer points explanation")
    .lean();

  return answers.map((answer) => formatUserAnswer(answer));
};

/**
 * GET ANSWER FOR SPECIFIC QUESTION
 */
export const getAnswerForQuestion = async (
  userExamId: string,
  questionId: string
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const userExam = await UserExamModel.findById(userExamId).lean();
  if (!userExam) throw new Error("Exam attempt not found");

  const answer = await UserAnswerModel.findOne({
    userExamId: userExamId,
    questionId: questionId,
  })
    .populate("questionId", "question type options correctAnswer points explanation")
    .lean();

  if (!answer) return null;

  return formatUserAnswer(answer);
};

/**
 * BULK SAVE ANSWERS
 */
export const bulkSaveAnswers = async (
  userExamId: string,
  answers: Array<{
    questionId: string;
    answer: string | string[];
    timeSpent?: number;
  }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const userExam = await UserExamModel.findById(userExamId).lean();
  if (!userExam) throw new Error("Exam attempt not found");

  if (userExam.status !== "IN_PROGRESS") {
    throw new Error("Exam is not in progress");
  }

  const saved = [];
  const errors = [];

  for (const answerData of answers) {
    try {
      const result = await saveAnswer({
        userExamId,
        ...answerData,
      });
      saved.push(result);
    } catch (error: any) {
      errors.push({
        questionId: answerData.questionId,
        error: error.message,
      });
    }
  }

  return {
    success: true,
    saved: saved.length,
    errors: errors.length > 0 ? errors : undefined,
  };
};
