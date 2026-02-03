import { NextRequest, NextResponse } from "next/server";
import { getEnrollmentsByClass } from "@/backend/controllers/enrollments.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const enrollments = await getEnrollmentsByClass(classId);

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: unknown) {
    console.error("Error fetching enrollments by class:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch enrollments";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden") ? 403 : 500,
      }
    );
  }
}
