import { NextRequest, NextResponse } from "next/server";
import { getEmailTemplateByType } from "@/backend/controllers/email-templates.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const { type } = await params;
    const template = await getEmailTemplateByType(type);

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
