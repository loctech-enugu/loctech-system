import { NextRequest, NextResponse } from "next/server";
import { getMyEnrollments } from "@/backend/controllers/students.controller";

export async function GET(req: NextRequest) {
  try {
    const enrollments = await getMyEnrollments();
    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: any) {
    console.error("Error fetching student enrollments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch enrollments",
      },
      {
        status: error.message?.includes("Unauthorized")
          ? 401
          : error.message?.includes("Forbidden")
          ? 403
          : 500,
      }
    );
  }
}
