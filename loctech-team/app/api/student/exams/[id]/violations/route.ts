import { NextRequest, NextResponse } from "next/server";
import { recordViolation } from "@/backend/controllers/user-exams.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const userExamId = body.userExamId || id;
    const violationType = body.violationType || "unknown";

    const result = await recordViolation(userExamId, violationType);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Violation recorded",
    });
  } catch (error: unknown) {
    console.error("Error recording violation:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to record violation";
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
          : errorMessage.includes("progress")
          ? 400
          : 500,
      }
    );
  }
}
