import { NextRequest, NextResponse } from "next/server";
import { getEnrollmentsByStudent } from "@/backend/controllers/enrollments.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;
    const enrollments = await getEnrollmentsByStudent(studentId);

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: unknown) {
    console.error("Error fetching enrollments by student:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch enrollments";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
