import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { EmailTemplateModel } from "../models/email-template.model";

/* eslint-disable */

/**
 * Format email template document for frontend
 */
export const formatEmailTemplate = (template: Record<string, any>) => {
  return {
    id: String(template._id),
    name: template.name ?? "",
    subject: template.subject ?? "",
    body: template.body ?? "",
    type: template.type ?? "",
    variables: template.variables ?? [],
    isActive: template.isActive ?? true,
    createdAt: (template.createdAt as Date)?.toISOString?.() ?? "",
    updatedAt: (template.updatedAt as Date)?.toISOString?.() ?? "",
  };
};

/**
 * 🟩 GET ALL EMAIL TEMPLATES
 */
export const getAllEmailTemplates = async (filters?: {
  type?: string;
  isActive?: boolean;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const filter: Record<string, any> = {};
  if (filters?.type) filter.type = filters.type;
  if (filters?.isActive !== undefined) filter.isActive = filters.isActive;

  const templates = await EmailTemplateModel.find(filter)
    .sort("name")
    .lean();

  return templates.map((template) => formatEmailTemplate(template));
};

/**
 * 🟦 GET ONE EMAIL TEMPLATE
 */
export const getEmailTemplateById = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const template = await EmailTemplateModel.findById(id).lean();
  if (!template) return null;

  return formatEmailTemplate(template);
};

/**
 * 🟩 CREATE EMAIL TEMPLATE
 */
export const createEmailTemplate = async (data: {
  name: string;
  subject: string;
  body: string;
  type:
    | "registration"
    | "exam_published"
    | "exam_submission"
    | "result_published"
    | "admin_registration"
    | "exam_reminder"
    | "system"
    | "absence_notification";
  variables?: string[];
  isActive?: boolean;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin and super_admin can create templates
  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  // Check if template with same name exists
  const existing = await EmailTemplateModel.findOne({
    name: data.name.trim(),
  });
  if (existing) {
    throw new Error("Template with this name already exists");
  }

  const template = await EmailTemplateModel.create({
    ...data,
    variables: data.variables ?? [],
    isActive: data.isActive ?? true,
  });

  return formatEmailTemplate(template.toObject());
};

/**
 * 🟧 UPDATE EMAIL TEMPLATE
 */
export const updateEmailTemplate = async (
  id: string,
  data: Partial<{
    name: string;
    subject: string;
    body: string;
    type: string;
    variables: string[];
    isActive: boolean;
  }>
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const template = await EmailTemplateModel.findById(id);
  if (!template) throw new Error("Template not found");

  // Check name uniqueness if name is being updated
  if (data.name && data.name.trim() !== template.name) {
    const existing = await EmailTemplateModel.findOne({
      name: data.name.trim(),
      _id: { $ne: id },
    });
    if (existing) {
      throw new Error("Template with this name already exists");
    }
  }

  Object.assign(template, data);
  await template.save();

  return formatEmailTemplate(template.toObject());
};

/**
 * 🟥 DELETE EMAIL TEMPLATE
 */
export const deleteEmailTemplate = async (id: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  if (session.user.role !== "admin" && session.user.role !== "super_admin") {
    throw new Error("Forbidden");
  }

  const deleted = await EmailTemplateModel.findByIdAndDelete(id);
  if (!deleted) throw new Error("Template not found");

  return { success: true };
};

/**
 * GET TEMPLATE BY TYPE
 */
export const getEmailTemplateByType = async (type: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const template = await EmailTemplateModel.findOne({
    type,
    isActive: true,
  }).lean();

  if (!template) return null;

  return formatEmailTemplate(template);
};
