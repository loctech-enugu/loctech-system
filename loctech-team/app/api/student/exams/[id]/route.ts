import { NextRequest, NextResponse } from "next/server";
import {
  startExam,
  getUserExamStatus,
} from "@/backend/controllers/user-exams.controller";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(
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

    const body = await req.json();
    const userId = body.userId || session.user.id;

    const examData = await startExam(id, userId);

    return NextResponse.json({
      success: true,
      data: examData,
      message: "Exam started successfully",
    });
  } catch (error: unknown) {
    console.error("Error starting exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to start exam";
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
              : errorMessage.includes("available") ||
                errorMessage.includes("started") ||
                errorMessage.includes("expired") ||
                errorMessage.includes("attempts")
                ? 400
                : 500,
      }
    );
  }
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: examId } = await context.params;
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
    const userExamId = searchParams.get("userExamId");

    if (!userExamId) {
      return NextResponse.json(
        {
          success: false,
          error: "userExamId is required",
        },
        { status: 400 }
      );
    }

    const status = await getUserExamStatus(userExamId);

    return NextResponse.json({
      success: true,
      data: { ...status, examId },
    });
  } catch (error: unknown) {
    console.error("Error fetching exam status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch exam status";
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
