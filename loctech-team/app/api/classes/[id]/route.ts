import { NextRequest, NextResponse } from "next/server";
import {
  getClassById,
  updateClass,
  deleteClass,
} from "@/backend/controllers/classes.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const classData = await getClassById(params.id);

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

async function handleUpdate(
  req: NextRequest,
  params: { id: string }
) {
  try {
    const body = await req.json();
    const classData = await updateClass(params.id, body);

    return NextResponse.json({
      success: true,
      data: classData,
      message: "Class updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating class:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update class",
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
  return handleUpdate(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  return handleUpdate(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await deleteClass(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Class deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting class:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete class",
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
