import { NextRequest, NextResponse } from "next/server";
import { getClassById } from "@/backend/controllers/classes.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const classData = await getClassById(id);

    if (!classData) {
      return NextResponse.json(
        {
          success: false,
          error: "Class not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: classData,
    });
  } catch (error: any) {
    console.error("Error fetching class:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch class",
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
