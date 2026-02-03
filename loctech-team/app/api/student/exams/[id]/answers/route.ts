import { NextRequest, NextResponse } from "next/server";
import {
  saveAnswer,
  bulkSaveAnswers,
  getAnswersForUserExam,
} from "@/backend/controllers/user-answers.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userExamId = searchParams.get("userExamId") || id;

    const answers = await getAnswersForUserExam(userExamId);

    return NextResponse.json({
      success: true,
      data: answers,
    });
  } catch (error: unknown) {
    console.error("Error fetching answers:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch answers";
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
            : 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await context.params;
    const body = await req.json();

    if (body.examId && body.examId !== examId) {
      return NextResponse.json(
        { success: false, error: "Exam ID in body does not match URL" },
        { status: 400 }
      );
    }

    // Check if bulk save
    if (Array.isArray(body.answers)) {
      const result = await bulkSaveAnswers(body.userExamId, body.answers);
      return NextResponse.json({
        success: true,
        data: result,
        message: "Answers saved successfully",
      });
    }

    // Single answer save
    const answer = await saveAnswer({
      userExamId: body.userExamId,
      questionId: body.questionId,
      answer: body.answer,
      timeSpent: body.timeSpent,
    });

    return NextResponse.json({
      success: true,
      data: answer,
      message: "Answer saved successfully",
    });
  } catch (error: unknown) {
    console.error("Error saving answer:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to save answer";
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
