import { NextRequest, NextResponse } from "next/server";
import { sendAbsenceNotification } from "@/backend/controllers/notifications.controller";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await sendAbsenceNotification(id);

    return NextResponse.json({
      success: true,
      data: result,
      message: "Notification email sent successfully",
    });
  } catch (error: unknown) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to send notification";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("not found")
            ? 404
            : errorMessage.includes("already sent")
              ? 400
              : 500,
      }
    );
  }
}
