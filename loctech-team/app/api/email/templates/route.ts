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

    const filters: any = {};
    if (type) filters.type = type;
    if (isActive !== null) filters.isActive = isActive === "true";

    const templates = await getAllEmailTemplates(filters);

    return NextResponse.json({
      success: true,
      data: templates,
    });
  } catch (error: any) {
    console.error("Error fetching email templates:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch email templates",
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
  } catch (error: any) {
    console.error("Error creating email template:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create email template",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("already exists")
          ? 400
          : 500,
      }
    );
  }
}
