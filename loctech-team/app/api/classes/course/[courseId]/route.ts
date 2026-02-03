import { NextRequest, NextResponse } from "next/server";
import { getClassesByCourse } from "@/backend/controllers/classes.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const { courseId } = await params;
    const classes = await getClassesByCourse(courseId);

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error: unknown) {
    console.error("Error fetching classes by course:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch classes";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
