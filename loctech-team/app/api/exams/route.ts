import { NextRequest, NextResponse } from "next/server";
import { getAllExams, createExam } from "@/backend/controllers/exams.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const courseId = searchParams.get("courseId");
    const classId = searchParams.get("classId");

    const filters: any = {};
    if (status) filters.status = status;
    if (courseId) filters.courseId = courseId;
    if (classId) filters.classId = classId;

    const exams = await getAllExams(filters);

    return NextResponse.json({
      success: true,
      data: exams,
    });
  } catch (error: any) {
    console.error("Error fetching exams:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch exams",
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
  } catch (error: any) {
    console.error("Error creating exam:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create exam",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found") || error.message?.includes("required")
          ? 400
          : 500,
      }
    );
  }
}
