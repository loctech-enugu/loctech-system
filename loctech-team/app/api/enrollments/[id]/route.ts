import { NextRequest, NextResponse } from "next/server";
import {
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
} from "@/backend/controllers/enrollments.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const enrollment = await getEnrollmentById(params.id);

    if (!enrollment) {
      return NextResponse.json(
        {
          success: false,
          error: "Enrollment not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: enrollment,
    });
  } catch (error: any) {
    console.error("Error fetching enrollment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch enrollment",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const enrollment = await updateEnrollment(params.id, body);

    return NextResponse.json({
      success: true,
      data: enrollment,
      message: "Enrollment updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating enrollment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update enrollment",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteEnrollment(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Enrollment deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting enrollment:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete enrollment",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}
