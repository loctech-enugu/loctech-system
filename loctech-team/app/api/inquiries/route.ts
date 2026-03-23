import { NextRequest, NextResponse } from "next/server";
import { createInquiry, getAllInquiries } from "@/backend/controllers/inquiry.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, courseOfInterest, heardAboutUs, message } = body;
    if (!name || !email || !message) {
      return errorResponse("Name, email, and message are required", 400);
    }
    const result = await createInquiry({
      name: String(name).trim(),
      email: String(email).trim(),
      phone: phone ? String(phone).trim() : undefined,
      courseOfInterest: courseOfInterest ? String(courseOfInterest).trim() : undefined,
      heardAboutUs: heardAboutUs ? String(heardAboutUs).trim() : undefined,
      message: String(message).trim(),
    });
    return successResponse(result, "Inquiry submitted successfully");
  } catch (error) {
    console.error("Create inquiry error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to submit inquiry", 500);
  }
}

function parsePositiveInt(value: string | null, fallback: number) {
  if (value === null || value === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? undefined;
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const limit = parsePositiveInt(searchParams.get("limit"), 20);
    const result = await getAllInquiries({ status, page, limit });
    return successResponse(result);
  } catch (error) {
    console.error("Get inquiries error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch inquiries", 500);
  }
}
