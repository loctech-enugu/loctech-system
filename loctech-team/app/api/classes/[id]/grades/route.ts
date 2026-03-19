import { NextResponse } from "next/server";
import { getClassGrades } from "@/backend/controllers/grades.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const grades = await getClassGrades(id);
    return successResponse(grades);
  } catch (error) {
    console.error("Get class grades error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to fetch grades", 500);
  }
}
