import { NextRequest, NextResponse } from "next/server";
import { publishExam } from "@/backend/controllers/exams.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json();
    const publish = body.publish ?? true;
    const { id } = await params;
    const exam = await publishExam(id, publish);

    return NextResponse.json({
      success: true,
      data: exam,
      message: publish ? "Exam published successfully" : "Exam unpublished successfully",
    });
  } catch (error: unknown) {
    console.error("Error publishing exam:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to publish exam";
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
            : errorMessage.includes("questions")
              ? 400
              : 500,
      }
    );
  }
}
