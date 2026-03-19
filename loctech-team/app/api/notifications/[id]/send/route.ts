import { NextResponse } from "next/server";
import {
  sendAbsenceNotification,
  sendAtRiskNotification,
} from "@/backend/controllers/notifications.controller";
import { connectToDatabase } from "@/lib/db";
import { NotificationModel } from "@/backend/models/notification.model";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await connectToDatabase();
    const notification = await NotificationModel.findById(id).select("type").lean();
    if (!notification) {
      return NextResponse.json({ success: false, error: "Notification not found" }, { status: 404 });
    }
    const result =
      notification.type === "at_risk_attendance" || notification.type === "at_risk_grade"
        ? await sendAtRiskNotification(id)
        : await sendAbsenceNotification(id);

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
