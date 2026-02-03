import { NextRequest, NextResponse } from "next/server";
import { getAllExams, createExam } from "@/backend/controllers/exams.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");
    const classId = searchParams.get("classId");

    const filters: Record<string, unknown> = {};
    if (status) filters.status = status;
    if (courseId) filters.courseId = courseId;
    if (classId) filters.classId = classId;

    const exams = await getAllExams(filters);

    return NextResponse.json({
      success: true,
      data: exams,
    });
  } catch (error: unknown) {
    console.error("Error fetching exams:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch exams";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const exam = await createExam(body);

    return NextResponse.json({
      success: true,
      data: exam,
      message: "Exam created successfully",
    });
  } catch (error: unknown) {
    console.error("Error creating exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create exam";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found") || errorMessage.includes("required")
          ? 400
          : 500,
      }
    );
  }
}
