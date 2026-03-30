import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { CategoryModel } from "../models/category.model";
import { auditLog } from "./audit-log.controller";

/* eslint-disable */

/**
 * Format category document for frontend
 */
export const formatCategory = (category: Record<string, any>) => {
  return {
    id: String(category._id),
    name: category.name ?? "",
    description: category.description ?? null,
    isActive: category.isActive ?? true,
    createdAt: (category.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (category.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL CATEGORIES
 */
export const getAllCategories = async (filters?: { isActive?: boolean }) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = {};
  if (filters?.isActive !== undefined) filter.isActive = filters.isActive;

  const categories = await CategoryModel.find(filter)
    .sort("name")
    .lean();

  return categories.map((category) => formatCategory(category));
};

/**
 * 🟦 GET ONE CATEGORY
 */
export const getCategoryById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const category = await CategoryModel.findById(id).lean();
  if (!category) return null;

  return formatCategory(category);
};

/**
 * 🟩 CREATE CATEGORY
 */
export const createCategory = async (data: {
  name: string;
  description?: string;
  isActive?: boolean;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");


  // Check if category with same name exists
  const existing = await CategoryModel.findOne({
    name: data.name.trim(),
  });
  if (existing) {
    throw new Error("Category with this name already exists");
  }

  const category = await CategoryModel.create({
    ...data,
    isActive: data.isActive ?? true,
  });

  await auditLog(session, {
    action: "create",
    resource: "category",
    resourceId: String(category._id),
    details: { name: data.name },
  });

  return formatCategory(category.toObject());
};

/**
 * 🟧 UPDATE CATEGORY
 */
export const updateCategory = async (
  id: string,
  data: Partial<{ name: string; description: string; isActive: boolean }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");


  const category = await CategoryModel.findById(id);
  if (!category) throw new Error("Category not found");

  // Check name uniqueness if name is being updated
  if (data.name && data.name.trim() !== category.name) {
    const existing = await CategoryModel.findOne({
      name: data.name.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new Error("Category with this name already exists");
    }
  }

  Object.assign(category, data);
  await category.save();

  await auditLog(session, {
    action: "update",
    resource: "category",
    resourceId: id,
    details: { fields: Object.keys(data) },
  });

  return formatCategory(category.toObject());
};

/**
 * 🟥 DELETE CATEGORY
 */
export const deleteCategory = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  // Check if category has questions
  const { QuestionModel } = await import("../models/question.model");
  const questionCount = await QuestionModel.countDocuments({ categoryId: id });
  if (questionCount > 0) {
    throw new Error(
      "Cannot delete category with questions. Please remove or reassign questions first."
    );
  }

  const deleted = await CategoryModel.findByIdAndDelete(id);
  if (!deleted) throw new Error("Category not found");

  await auditLog(session, {
    action: "delete",
    resource: "category",
    resourceId: id,
  });

  return { success: true };
};
