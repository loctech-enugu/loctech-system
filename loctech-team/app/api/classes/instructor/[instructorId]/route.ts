import { NextRequest, NextResponse } from "next/server";
import { getClassesByInstructor } from "@/backend/controllers/classes.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ instructorId: string }> }
) {
  try {
    const { instructorId } = await params;
    const classes = await getClassesByInstructor(instructorId);

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error: unknown) {
    console.error("Error fetching classes by instructor:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch classes";
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
