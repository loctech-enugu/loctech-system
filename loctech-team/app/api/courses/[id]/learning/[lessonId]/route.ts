import { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { CourseLearningModel } from "@/backend/models/course-learning.model";
import { successResponse, errorResponse } from "@/lib/server-helper";

function makeSlug(input: string, withSuffix = true) {
  const base = String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const fallback = base || "lesson";
  if (!withSuffix) return fallback;
  const suffix = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  return `${fallback}-${suffix}`;
}

function stripColorStyling(contentHtml: string) {
  if (!contentHtml) return "";
  return contentHtml.replace(
    /style\s*=\s*(['"])([\s\S]*?)\1/gi,
    (_full, quote: string, styleValue: string) => {
      const kept = styleValue
        .split(";")
        .map((rule) => rule.trim())
        .filter(Boolean)
        .filter((rule) => {
          const property = rule.split(":")[0]?.trim().toLowerCase() || "";
          return !(
            property === "color" ||
            property === "background" ||
            property === "background-color" ||
            property.startsWith("background-")
          );
        });
      return kept.length > 0 ? `style=${quote}${kept.join("; ")}${quote}` : "";
    }
  );
}

async function assertManageAccess() {
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");
  if (session.user.role === "staff") throw new Error("Forbidden");
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await connectToDatabase();
    await assertManageAccess();
    const { id, lessonId } = await params;
    const body = await req.json();
    const nextTitle = String(body.title || "").trim();
    const nextContentHtml =
      body.contentHtml !== undefined
        ? stripColorStyling(String(body.contentHtml || ""))
        : undefined;

    const lesson = await CourseLearningModel.findOneAndUpdate(
      { _id: lessonId, courseId: id },
      {
        title: nextTitle,
        ...(nextTitle ? { slug: makeSlug(nextTitle, true) } : {}),
        order: body.order,
        contentHtml: nextContentHtml,
        estimatedMinutes: body.estimatedMinutes,
        isPublished: body.isPublished,
      },
      { new: true }
    ).lean();

    if (!lesson) throw new Error("Lesson not found");
    return successResponse({ id: String(lesson._id) }, "Learning lesson updated");
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to update learning lesson", 500);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; lessonId: string }> }
) {
  try {
    await connectToDatabase();
    await assertManageAccess();
    const { id, lessonId } = await params;
    await CourseLearningModel.findOneAndDelete({ _id: lessonId, courseId: id });
    return successResponse({ success: true }, "Learning lesson deleted");
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to delete learning lesson", 500);
  }
}
