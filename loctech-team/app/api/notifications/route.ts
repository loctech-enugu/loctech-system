import { NextRequest, NextResponse } from "next/server";
import {
  getAllNotifications,
  createNotification,
  getNotificationsRequiringAction,
} from "@/backend/controllers/notifications.controller";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const actionRequired = searchParams.get("actionRequired");
    const studentId = searchParams.get("studentId");
    const classId = searchParams.get("classId");
    const type = searchParams.get("type");

    // Get notifications requiring action
    if (actionRequired === "true") {
      const notifications = await getNotificationsRequiringAction();
      return NextResponse.json({
        success: true,
        data: notifications,
      });
    }

    // Get all notifications with filters
    const filters: any = {};
    if (studentId) filters.studentId = studentId;
    if (classId) filters.classId = classId;
    if (type) filters.type = type;

    const notifications = await getAllNotifications(filters);

    return NextResponse.json({
      success: true,
      data: notifications,
    });
  } catch (error: any) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const notification = await createNotification(body);

    return NextResponse.json({
      success: true,
      data: notification,
      message: "Notification created successfully",
    });
  } catch (error: any) {
    console.error("Error creating notification:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to create notification",
      },
      { status: error.message?.includes("Forbidden") ? 403 : 500 }
    );
  }
}
