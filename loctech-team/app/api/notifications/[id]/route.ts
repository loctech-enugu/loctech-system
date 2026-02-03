import { NextRequest, NextResponse } from "next/server";
import { getNotificationById } from "@/backend/controllers/notifications.controller";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const notification = await getNotificationById(id);

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
  } catch (error: unknown) {
    console.error("Error fetching notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notification";
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
          : 500,
      }
    );
  }
}
