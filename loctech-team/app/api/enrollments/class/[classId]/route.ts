import { NextRequest, NextResponse } from "next/server";
import { getEnrollmentsByClass } from "@/backend/controllers/enrollments.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  try {
    const enrollments = await getEnrollmentsByClass(params.classId);

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: any) {
    console.error("Error fetching enrollments by class:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch enrollments",
      },
      {
        status: error.message?.includes("Forbidden") ? 403 : 500,
      }
    );
  }
}
