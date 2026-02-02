import { NextRequest, NextResponse } from "next/server";
import { getNotificationsRequiringAction } from "@/backend/controllers/notifications.controller";

export async function GET(req: NextRequest) {
  try {
    const notifications = await getNotificationsRequiringAction();

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    console.error("Error fetching notifications requiring action:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch notifications",
      },
      {
        status: error.message?.includes("Forbidden")
          ? 403
          : error.message?.includes("Unauthorized")
          ? 401
          : 500,
      }
    );
  }
}
