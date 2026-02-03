import { NextRequest, NextResponse } from "next/server";
import { submitExam } from "@/backend/controllers/user-exams.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userExamId = body.userExamId || id;

    const result = await submitExam(userExamId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Exam submitted successfully",
    });
  } catch (error: unknown) {
    console.error("Error submitting exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to submit exam";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found")
          ? 404
          : errorMessage.includes("progress")
          ? 400
          : 500,
      }
    );
  }
}
