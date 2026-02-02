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

    const filters: any = {};
    if (classId) filters.classId = classId;
    if (studentId) filters.studentId = studentId;
    if (status) filters.status = status;

    const enrollments = await getAllEnrollments(filters);

    return NextResponse.json({
      success: true,
      data: enrollments,
    });
  } catch (error: any) {
    console.error("Error fetching enrollments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch enrollments",
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
  } catch (error: any) {
    console.error("Error creating enrollment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create enrollment",
      },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
