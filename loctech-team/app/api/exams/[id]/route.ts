import { NextRequest, NextResponse } from "next/server";
import {
  getExamById,
  updateExam,
  deleteExam,
} from "@/backend/controllers/exams.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const exam = await getExamById(id);

    if (!exam) {
      return NextResponse.json(
        {
          success: false,
          error: "Exam not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: exam,
    });
  } catch (error: unknown) {
    console.error("Error fetching exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch exam";
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
    const exam = await updateExam(id, body);

    return NextResponse.json({
      success: true,
      data: exam,
      message: "Exam updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update exam";
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
          : errorMessage.includes("draft")
          ? 400
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
    const result = await deleteExam(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Exam deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete exam";
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
          : errorMessage.includes("attempts")
          ? 400
          : 500,
      }
    );
  }
}
