import { NextRequest, NextResponse } from "next/server";
import {
  getExamResults,
  publishExamResults,
} from "@/backend/controllers/exams.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const results = await getExamResults(params.id);

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    console.error("Error fetching exam results:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch exam results",
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

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const userIds = body.userIds; // optional array of user IDs
    const result = await publishExamResults(params.id, userIds);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Exam results published successfully",
    });
  } catch (error: any) {
    console.error("Error publishing exam results:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to publish exam results",
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
