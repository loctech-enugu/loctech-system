import { listAssignableStaffForInquiries } from "@/backend/controllers/inquiry.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function GET() {
  try {
    const staff = await listAssignableStaffForInquiries();
    return successResponse(staff);
  } catch (error) {
    console.error("Assignable staff error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to load staff", 500);
  }
}
