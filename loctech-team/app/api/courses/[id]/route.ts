import { NextResponse } from "next/server";
import {
  deleteCourse,
  getCourseById,
  updateCourse,
} from "@/backend/controllers/courses.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

// ✅ GET /api/courses/:id - Fetch single course
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const course = await getCourseById(id);

    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch course",
      },
      { status: 500 }
    );
  }
}

// ✅ PATCH /api/courses/:id - Update course
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const updated = await updateCourse(id, body);

    if (!updated) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return NextResponse.json(updated, { status: 200 });
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to update course",
      500
    );
  }
}

// ✅ DELETE /api/courses/:id - Delete course
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteCourse(id);

    if (!deleted) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    return successResponse(undefined, "Course deleted successfully", 200);
  } catch (error) {
    return errorResponse(
      error instanceof Error ? error.message : "Failed to delete course",
      500
    );
  }
}
