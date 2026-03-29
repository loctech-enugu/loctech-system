import { NextRequest, NextResponse } from "next/server";
import { convertInquiryToStudent } from "@/backend/controllers/inquiry.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const result = await convertInquiryToStudent(id, body);
    return successResponse(result, "Student created from inquiry");
  } catch (error) {
    console.error("convertInquiryToStudent error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to convert inquiry",
      500
    );
  }
}
