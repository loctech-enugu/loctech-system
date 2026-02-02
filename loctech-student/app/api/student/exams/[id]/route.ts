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
    const { id } = await params;

    const examData = await startExam(id, userId);

    return NextResponse.json({
      success: true,
      data: examData,
      message: "Exam started successfully",
    });
  } catch (error: any) {
    console.error("Error starting exam:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to start exam",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("Unauthorized")
          ? 401
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("available") ||
            error.message?.includes("started") ||
            error.message?.includes("expired") ||
            error.message?.includes("attempts")
          ? 400
          : 500,
      }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
      data: status,
    });
  } catch (error: any) {
    console.error("Error fetching exam status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch exam status",
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
