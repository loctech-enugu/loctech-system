import { NextRequest, NextResponse } from "next/server";
import {
  getQuestionById,
  updateQuestion,
  deleteQuestion,
} from "@/backend/controllers/questions.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const question = await getQuestionById(params.id);

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
  } catch (error: any) {
    console.error("Error fetching question:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch question",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const question = await updateQuestion(params.id, body);

    return NextResponse.json({
      success: true,
      data: question,
      message: "Question updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating question:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update question",
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteQuestion(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Question deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting question:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete question",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("exams")
          ? 400
          : 500,
      }
    );
  }
}
