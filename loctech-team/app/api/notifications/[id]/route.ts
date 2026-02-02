import { NextRequest, NextResponse } from "next/server";
import { getNotificationById } from "@/backend/controllers/notifications.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notification = await getNotificationById(params.id);

    if (!notification) {
      return NextResponse.json(
        {
          success: false,
          error: "Notification not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: notification,
    });
  } catch (error: any) {
    console.error("Error fetching notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch notification",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}
