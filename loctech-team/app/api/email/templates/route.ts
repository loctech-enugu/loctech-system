import { NextRequest, NextResponse } from "next/server";
import {
  getAllEmailTemplates,
  createEmailTemplate,
} from "@/backend/controllers/email-templates.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const isActive = searchParams.get("isActive");

    const filters: Record<string, unknown> = {};
    if (type) filters.type = type;
    if (isActive !== null) filters.isActive = isActive === "true";

    const templates = await getAllEmailTemplates(filters);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: unknown) {
    console.error("Error fetching email templates:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch email templates";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const template = await createEmailTemplate(body);

    return NextResponse.json({
      success: true,
      data: template,
      message: "Email template created successfully",
    });
  } catch (error: unknown) {
    console.error("Error creating email template:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create email template";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("already exists")
          ? 400
          : 500,
      }
    );
  }
}
