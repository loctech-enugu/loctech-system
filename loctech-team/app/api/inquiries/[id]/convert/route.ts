import { NextRequest, NextResponse } from "next/server";
import { markInquiryConverted } from "@/backend/controllers/inquiry.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { studentId } = body;
    if (!studentId) throw new Error("studentId is required");
    await markInquiryConverted(id, studentId);
    return successResponse({ success: true }, "Inquiry marked as converted");
  } catch (error) {
    console.error("Mark inquiry converted error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to update inquiry", 500);
  }
}
