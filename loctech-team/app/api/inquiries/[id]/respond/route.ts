import { NextResponse } from "next/server";
import { markInquiryResponded } from "@/backend/controllers/inquiry.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function PATCH(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await markInquiryResponded(id);
    return successResponse({ success: true }, "Inquiry marked as responded");
  } catch (error) {
    console.error("Mark inquiry responded error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to update inquiry", 500);
  }
}
