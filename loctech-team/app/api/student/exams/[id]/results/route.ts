import { NextRequest, NextResponse } from "next/server";
import { getExamResult } from "@/backend/controllers/exams.controller";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session.user.id;

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
          : errorMessage.includes("Unauthorized")
          ? 401
          : errorMessage.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}
