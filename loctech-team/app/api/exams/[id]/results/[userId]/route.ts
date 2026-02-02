import { NextRequest, NextResponse } from "next/server";
import { getExamResult } from "@/backend/controllers/exams.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const result = await getExamResult(params.id, params.userId);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    console.error("Error fetching exam result:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch exam result",
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
