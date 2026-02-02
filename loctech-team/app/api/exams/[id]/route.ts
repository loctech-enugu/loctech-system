import { NextRequest, NextResponse } from "next/server";
import {
  getExamById,
  updateExam,
  deleteExam,
} from "@/backend/controllers/exams.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const exam = await getExamById(params.id);

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
  } catch (error: any) {
    console.error("Error fetching exam:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch exam",
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
    const exam = await updateExam(params.id, body);

    return NextResponse.json({
      success: true,
      data: exam,
      message: "Exam updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating exam:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update exam",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("draft")
          ? 400
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
    const result = await deleteExam(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Exam deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting exam:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete exam",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("attempts")
          ? 400
          : 500,
      }
    );
  }
}
