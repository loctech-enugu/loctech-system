import { NextRequest, NextResponse } from "next/server";
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from "@/backend/controllers/questions.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const question = await getQuestionById(id);

    if (!question) {
      return NextResponse.json(
        {
          success: false,
          error: "Question not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: question,
    });
  } catch (error: unknown) {
    console.error("Error fetching question:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch question";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const question = await updateQuestion(id, body);

    return NextResponse.json({
      success: true,
      data: question,
      message: "Question updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating question:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update question";
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteQuestion(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Question deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting question:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete question";
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
            : errorMessage.includes("exams")
              ? 400
              : 500,
      }
    );
  }
}
