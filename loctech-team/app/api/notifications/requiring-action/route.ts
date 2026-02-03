import { NextResponse } from "next/server";
import { getNotificationsRequiringAction } from "@/backend/controllers/notifications.controller";

export async function GET() {
  try {
    const notifications = await getNotificationsRequiringAction();

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: unknown) {
    console.error("Error fetching notifications requiring action:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch notifications";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      {
        status: errorMessage.includes("Forbidden")
          ? 403
          : errorMessage.includes("Unauthorized")
            ? 401
            : 500,
      }
    );
  }
}
