import { NextRequest, NextResponse } from "next/server";
import {
  getExamResults,
  publishExamResults,
} from "@/backend/controllers/exams.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const results = await getExamResults(id);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: unknown) {
    console.error("Error fetching exam results:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch exam results";
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

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const userIds = body.userIds; // optional array of user IDs
    const { id } = await params;
    const result = await publishExamResults(id, userIds);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Exam results published successfully",
    });
  } catch (error: unknown) {
    console.error("Error publishing exam results:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish exam results";
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
