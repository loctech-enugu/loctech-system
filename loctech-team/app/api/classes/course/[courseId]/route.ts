import { NextRequest, NextResponse } from "next/server";
import { getClassesByCourse } from "@/backend/controllers/classes.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const classes = await getClassesByCourse(params.courseId);

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    console.error("Error fetching classes by course:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch classes",
      },
      { status: 500 }
    );
  }
}
