import { NextRequest, NextResponse } from "next/server";
import {
  getEmailTemplateById,
  updateEmailTemplate,
  deleteEmailTemplate,
} from "@/backend/controllers/email-templates.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const template = await getEmailTemplateById(params.id);

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
  } catch (error: any) {
    console.error("Error fetching email template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch email template",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const template = await updateEmailTemplate(params.id, body);

    return NextResponse.json({
      success: true,
      data: template,
      message: "Email template updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating email template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update email template",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("already exists")
          ? 400
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
    const result = await deleteEmailTemplate(params.id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Email template deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting email template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to delete email template",
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
