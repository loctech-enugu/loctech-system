import { NextRequest, NextResponse } from "next/server";
import { recordViolation } from "@/backend/controllers/user-exams.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const userExamId = body.userExamId || (await params).id;
    const violationType = body.violationType || "unknown";

    const result = await recordViolation(userExamId, violationType);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Violation recorded",
    });
  } catch (error: any) {
    console.error("Error recording violation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to record violation",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("progress")
          ? 400
          : 500,
      }
    );
  }
}
