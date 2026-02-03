import { NextRequest, NextResponse } from "next/server";
import { getAvailableExams } from "@/backend/controllers/user-exams.controller";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
  try {
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

    const exams = await getAvailableExams(userId);

    return NextResponse.json({
      success: true,
      data: exams,
    });
  } catch (error: unknown) {
    console.error("Error fetching available exams:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch available exams";
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
          : 500,
      }
    );
  }
}
