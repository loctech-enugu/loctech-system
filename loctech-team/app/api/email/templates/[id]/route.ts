import { NextRequest, NextResponse } from "next/server";
import {
  getEmailTemplateById,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "@/backend/controllers/email-templates.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const template = await getEmailTemplateById(id);

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: "Email template not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: template,
    });
  } catch (error: unknown) {
    console.error("Error fetching email template:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch email template";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const template = await updateEmailTemplate(id, body);

    return NextResponse.json({
      success: true,
      data: template,
      message: "Email template updated successfully",
    });
  } catch (error: unknown) {
    console.error("Error updating email template:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update email template";
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
          : errorMessage.includes("already exists")
          ? 400
          : 500,
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await deleteEmailTemplate(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Email template deleted successfully",
    });
  } catch (error: unknown) {
    console.error("Error deleting email template:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to delete email template";
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
