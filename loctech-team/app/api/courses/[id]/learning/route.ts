import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { CourseModel } from "@/backend/models/courses.model";
import { CourseLearningModel } from "@/backend/models/course-learning.model";
import { successResponse, errorResponse } from "@/lib/server-helper";

function makeSlug(input: string, withSuffix = true) {
  const base = input
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
  return contentHtml
    .replace(/style\s*=\s*(['"])([\s\S]*?)\1/gi, (_full, quote: string, styleValue: string) => {
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

      if (kept.length === 0) return "";
      return `style=${quote}${kept.join("; ")}${quote}`;
    })
    .replace(/<(span|font)([^>]*)>\s*<\/\1>/gi, "");
}

async function assertManageCourse(courseId: string) {
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const course = await CourseModel.findById(courseId).lean();
  if (!course) throw new Error("Course not found");

  if (session.user.role === "staff") throw new Error("Forbidden");
  return session;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    await assertManageCourse(id);

    const lessons = await CourseLearningModel.find({ courseId: id }).sort({ order: 1, createdAt: 1 }).lean();
    return successResponse(
      lessons.map((l) => ({
        id: String(l._id),
        courseId: String(l.courseId),
        title: l.title,
        slug: l.slug,
        order: l.order,
        contentHtml: stripColorStyling(l.contentHtml || ""),
        estimatedMinutes: l.estimatedMinutes,
        isPublished: l.isPublished,
      }))
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch learning lessons", 500);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const session = await assertManageCourse(id);
    const body = await req.json();

    const lesson = await CourseLearningModel.create({
      courseId: id,
      title: String(body.title || "Untitled lesson").trim(),
      slug: makeSlug(String(body.title || "Untitled lesson"), true),
      order: Number(body.order ?? 0),
      contentHtml: stripColorStyling(String(body.contentHtml || "")),
      estimatedMinutes: Number(body.estimatedMinutes ?? 15),
      isPublished: Boolean(body.isPublished),
      createdBy: session.user.id,
    });

    return successResponse(
      {
        id: String(lesson._id),
      },
      "Learning lesson created",
      201
    );
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Failed to create learning lesson", 500);
  }
}
