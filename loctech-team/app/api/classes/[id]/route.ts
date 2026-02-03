import { NextRequest, NextResponse } from "next/server";
import {
  getClassById,
  updateClass,
  deleteClass,
} from "@/backend/controllers/classes.controller";

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
  } catch (error: unknown) {
    console.error("Error fetching class:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch class";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found")
            ? 404
            : 500,
      }
    );
  }
}

async function handleUpdate(
  req: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const classData = await updateClass(id, body);

    return NextResponse.json({
      success: true,
      data: classData,
      message: "Class updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating class:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update class";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found")
            ? 404
            : 500,
      }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleUpdate(req, params);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteClass(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Class deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting class:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete class";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found")
            ? 404
            : 500,
      }
    );
  }
}
