import { NextRequest, NextResponse } from "next/server";
import { getEmailTemplateByType } from "@/backend/controllers/email-templates.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { type: string } }
) {
  try {
    const template = await getEmailTemplateByType(params.type);

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
