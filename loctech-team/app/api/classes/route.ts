import { NextRequest, NextResponse } from "next/server";
import {
  getAllClasses,
  createClass,
} from "@/backend/controllers/classes.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get("courseId");
    const instructorId = searchParams.get("instructorId");
    const status = searchParams.get("status");

    const filters: any = {};
    if (courseId) filters.courseId = courseId;
    if (instructorId) filters.instructorId = instructorId;
    if (status) filters.status = status;

    const classes = await getAllClasses(filters);

    return NextResponse.json({
      success: true,
      data: classes,
    });
  } catch (error: any) {
    console.error("Error fetching classes:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch classes",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const classData = await createClass(body);

    return NextResponse.json({
      success: true,
      data: classData,
      message: "Class created successfully",
    });
  } catch (error: any) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create class",
      },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
