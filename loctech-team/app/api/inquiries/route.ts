import { NextRequest, NextResponse } from "next/server";
import { createInquiry, getAllInquiries } from "@/backend/controllers/inquiry.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, courseOfInterest, message } = body;
    if (!name || !email || !message) {
      return errorResponse("Name, email, and message are required", 400);
    }
    const result = await createInquiry({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : undefined,
      courseOfInterest: courseOfInterest ? String(courseOfInterest).trim() : undefined,
      message: String(message).trim(),
    });
    return successResponse(result, "Inquiry submitted successfully");
  } catch (error) {
    console.error("Create inquiry error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to submit inquiry", 500);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const inquiries = await getAllInquiries({ status });
    return successResponse(inquiries);
  } catch (error) {
    console.error("Get inquiries error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch inquiries", 500);
  }
}
