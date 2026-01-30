import { NextRequest, NextResponse } from "next/server";
import { getClassesByInstructor } from "@/backend/controllers/classes.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { instructorId: string } }
) {
  try {
    const classes = await getClassesByInstructor(params.instructorId);

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    console.error("Error fetching classes by instructor:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch classes",
      },
      {
        status: error.message?.includes("Forbidden") ? 403 : 500,
      }
    );
  }
}
