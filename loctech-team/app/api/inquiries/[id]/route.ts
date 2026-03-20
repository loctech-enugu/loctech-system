import { NextRequest } from "next/server";
import { updateInquiry } from "@/backend/controllers/inquiry.controller";
import { successResponse, errorResponse } from "@/lib/server-helper";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      customerCareId,
      lead,
      feedback,
      followUp,
      status,
      adminNote,
    } = body;

    const updated = await updateInquiry(id, {
      customerCareId: customerCareId === undefined ? undefined : customerCareId || null,
      lead,
      feedback,
      followUp: followUp === undefined ? undefined : followUp || null,
      status,
      adminNote,
    });

    return successResponse(updated, "Inquiry updated");
  } catch (error) {
    console.error("Update inquiry error:", error);
    return errorResponse(error instanceof Error ? error.message : "Failed to update inquiry", 500);
  }
}
