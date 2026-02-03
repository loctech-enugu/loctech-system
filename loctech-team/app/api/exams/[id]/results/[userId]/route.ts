import { NextRequest, NextResponse } from "next/server";
import { getExamResult } from "@/backend/controllers/exams.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id, userId } = await params;
    const result = await getExamResult(id, userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: unknown) {
    console.error("Error fetching exam result:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch exam result";
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
