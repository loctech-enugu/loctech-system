import { NextRequest, NextResponse } from "next/server";
import { publishExam } from "@/backend/controllers/exams.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const publish = body.publish ?? true;
    const exam = await publishExam(params.id, publish);

    return NextResponse.json({
      success: true,
      data: exam,
      message: publish ? "Exam published successfully" : "Exam unpublished successfully",
    });
  } catch (error: any) {
    console.error("Error publishing exam:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to publish exam",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("questions")
          ? 400
          : 500,
      }
    );
  }
}
