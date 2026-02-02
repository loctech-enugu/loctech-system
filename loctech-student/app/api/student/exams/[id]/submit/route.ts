import { NextRequest, NextResponse } from "next/server";
import { submitExam } from "@/backend/controllers/user-exams.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const userExamId = body.userExamId || (await params).id;
    const result = await submitExam(userExamId);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Exam submitted successfully",
    });
  } catch (error: any) {
    console.error("Error submitting exam:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to submit exam",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("progress")
          ? 400
          : 500,
      }
    );
  }
}
