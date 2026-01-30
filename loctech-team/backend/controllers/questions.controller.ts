import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { QuestionModel } from "../models/question.model";
import { CategoryModel } from "../models/category.model";

/* eslint-disable */

/**
 * Format question document for frontend
 */
export const formatQuestion = (question: Record<string, any>) => {
  const category = question.categoryId as Record<string, any> | null;

  return {
    id: String(question._id),
    type: question.type ?? "",
    question: question.question ?? "",
    options: question.options ?? [],
    correctAnswer: question.correctAnswer,
    explanation: question.explanation ?? null,
    points: question.points ?? 1,
    difficulty: question.difficulty ?? "medium",
    categoryId: String(question.categoryId),
    category: category
      ? {
          id: String(category._id),
          name: category.name ?? "",
        }
      : null,
    tags: question.tags ?? [],
    isActive: question.isActive ?? true,
    createdAt: (question.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (question.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL QUESTIONS (Question Bank)
 */
export const getAllQuestions = async (filters?: {
  categoryId?: string;
  difficulty?: string;
  type?: string;
  isActive?: boolean;
  search?: string;
  tags?: string[];
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = {};

  if (filters?.categoryId) filter.categoryId = filters.categoryId;
  if (filters?.difficulty) filter.difficulty = filters.difficulty;
  if (filters?.type) filter.type = filters.type;
  if (filters?.isActive !== undefined) filter.isActive = filters.isActive;
  if (filters?.tags && filters.tags.length > 0) {
    filter.tags = { $in: filters.tags };
  }
  if (filters?.search) {
    filter.$or = [
      { question: { $regex: filters.search, $options: "i" } },
      { explanation: { $regex: filters.search, $options: "i" } },
    ];
  }

  const questions = await QuestionModel.find(filter)
    .populate("categoryId", "name")
    .sort("-createdAt")
    .lean();

  return questions.map((question) => formatQuestion(question));
};

/**
 * 🟦 GET ONE QUESTION
 */
export const getQuestionById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const question = await QuestionModel.findById(id)
    .populate("categoryId", "name")
    .lean();

  if (!question) return null;

  return formatQuestion(question);
};

/**
 * 🟩 CREATE QUESTION
 */
export const createQuestion = async (data: {
  type: "mcq" | "true_false" | "essay" | "fill_blank" | "matching";
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  difficulty: "easy" | "medium" | "hard";
  categoryId: string;
  tags?: string[];
  isActive?: boolean;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin and super_admin can create questions
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  // Validate category exists
  const category = await CategoryModel.findById(data.categoryId);
  if (!category) throw new Error("Category not found");

  const question = await QuestionModel.create({
    ...data,
    isActive: data.isActive ?? true,
  });

  const populated = await QuestionModel.findById(question._id)
    .populate("categoryId", "name")
    .lean();

  return formatQuestion(populated!);
};

/**
 * 🟧 UPDATE QUESTION
 */
export const updateQuestion = async (
  id: string,
  data: Partial<{
    type: "mcq" | "true_false" | "essay" | "fill_blank" | "matching";
    question: string;
    options: string[];
    correctAnswer: string | string[];
    explanation: string;
    points: number;
    difficulty: "easy" | "medium" | "hard";
    categoryId: string;
    tags: string[];
    isActive: boolean;
  }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const question = await QuestionModel.findById(id);
  if (!question) throw new Error("Question not found");

  // Validate category if being changed
  if (data.categoryId) {
    const category = await CategoryModel.findById(data.categoryId);
    if (!category) throw new Error("Category not found");
  }

  Object.assign(question, data);
  await question.save();

  const updated = await QuestionModel.findById(id)
    .populate("categoryId", "name")
    .lean();

  return formatQuestion(updated!);
};

/**
 * 🟥 DELETE QUESTION
 */
export const deleteQuestion = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  // Check if question is used in exams
  const { ExamModel } = await import("../models/exam.model");
  const exams = await ExamModel.find({ questionIds: id });
  if (exams.length > 0) {
    throw new Error(
      "Cannot delete question used in exams. Please remove from exams first."
    );
  }

  const deleted = await QuestionModel.findByIdAndDelete(id);
  if (!deleted) throw new Error("Question not found");

  return { success: true };
};

/**
 * BULK CREATE QUESTIONS
 */
export const bulkCreateQuestions = async (
  questions: Array<{
    type: "mcq" | "true_false" | "essay" | "fill_blank" | "matching";
    question: string;
    options?: string[];
    correctAnswer: string | string[];
    explanation?: string;
    points: number;
    difficulty: "easy" | "medium" | "hard";
    categoryId: string;
    tags?: string[];
  }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const created = [];
  const errors = [];

  for (const qData of questions) {
    try {
      // Validate category
      const category = await CategoryModel.findById(qData.categoryId);
      if (!category) {
        errors.push({ question: qData.question, error: "Category not found" });
        continue;
      }

      const question = await QuestionModel.create({
        ...qData,
        isActive: true,
      });
      created.push(question);
    } catch (error: any) {
      errors.push({ question: qData.question, error: error.message });
    }
  }

  return {
    success: true,
    created: created.length,
    errors: errors.length > 0 ? errors : undefined,
  };
};
