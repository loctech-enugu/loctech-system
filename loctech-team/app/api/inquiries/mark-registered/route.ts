import { markRegisteredInquiry } from "@/backend/controllers/inquiry.controller";
import { errorResponse, successResponse } from "@/lib/server-helper";

/** POST — sync pending inquiries to registered when email matches a student */
export async function POST() {
  try {
    const result = await markRegisteredInquiry();
    return successResponse(
      result,
      `${result.updated} inquiry(ies) marked as registered (matched by student email)`
    );
  } catch (error) {
    console.error("markRegisteredInquiry error:", error);
    return errorResponse(
      error instanceof Error ? error.message : "Failed to sync inquiries",
      error instanceof Error && error.message === "Forbidden"
        ? 403
        : error instanceof Error && error.message === "Unauthorized"
          ? 401
          : 500
    );
  }
}
