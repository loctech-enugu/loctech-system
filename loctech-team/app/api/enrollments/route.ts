import { NextRequest, NextResponse } from "next/server";
import {
  getAllEnrollments,
  createEnrollment,
  bulkCreateEnrollments,
} from "@/backend/controllers/enrollments.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    const filters: Record<string, unknown> = {};
    if (classId) filters.classId = classId;
    if (studentId) filters.studentId = studentId;
    if (status) filters.status = status;

    const enrollments = await getAllEnrollments(filters);

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: unknown) {
    console.error("Error fetching enrollments:", error);
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Check if bulk create
    if (body.studentIds && Array.isArray(body.studentIds)) {
      const result = await bulkCreateEnrollments(body.studentIds, body.classId);
      return NextResponse.json({
        success: true,
        data: result,
        message: "Enrollments created successfully",
      });
    }

    // Single enrollment
    const enrollment = await createEnrollment(body);

    return NextResponse.json({
      success: true,
      data: enrollment,
      message: "Enrollment created successfully",
    });
  } catch (error: unknown) {
    console.error("Error creating enrollment:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create enrollment";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: errorMessage.includes("Forbidden") ? 403 : 500 }
    );
  }
}
