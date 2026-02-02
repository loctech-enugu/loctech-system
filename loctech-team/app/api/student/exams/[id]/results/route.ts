import { NextRequest, NextResponse } from "next/server";
import { getExamResult } from "@/backend/controllers/exams.controller";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const result = await getExamResult(params.id, userId);

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
          : error.message?.includes("Unauthorized")
          ? 401
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}
