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
    const { searchParams } = new URL(req.url);
    const userExamId = searchParams.get("userExamId") || (await params).id;
    const answers = await getAnswersForUserExam(userExamId);

    return NextResponse.json({
      success: true,
      data: answers,
    });
  } catch (error: any) {
    console.error("Error fetching answers:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch answers",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
            ? 404
            : 500,
      }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();

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
  } catch (error: any) {
    console.error("Error saving answer:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to save answer",
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
