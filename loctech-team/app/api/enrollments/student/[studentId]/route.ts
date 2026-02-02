import { NextRequest, NextResponse } from "next/server";
import { getEnrollmentsByStudent } from "@/backend/controllers/enrollments.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const enrollments = await getEnrollmentsByStudent(params.studentId);

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: any) {
    console.error("Error fetching enrollments by student:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch enrollments",
      },
      { status: 500 }
    );
  }
}
