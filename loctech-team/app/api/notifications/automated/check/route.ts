import { NextRequest, NextResponse } from "next/server";
import {
  checkAndCreateAbsenceNotifications,
  sendAutomatedAbsenceNotifications,
} from "@/backend/controllers/notifications.controller";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json(
        {
          success: false,
          error: "Unauthorized",
        },
        { status: 401 }
      );
    }

    // Only admin and staff can trigger automated checks
    if (
      session.user.role !== "admin" &&
      session.user.role !== "super_admin" &&
      session.user.role !== "staff"
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Forbidden",
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const classId = body.classId; // optional
    const sendEmails = body.sendEmails ?? false;

    // Check and create notifications
    await checkAndCreateAbsenceNotifications(classId);

    let emailResults = null;
    if (sendEmails) {
      emailResults = await sendAutomatedAbsenceNotifications();
    }

    return NextResponse.json({
      success: true,
      message: "Absence notifications checked",
      data: {
        emailsSent: emailResults?.sent ?? 0,
        emailsFailed: emailResults?.failed ?? 0,
        errors: emailResults?.errors ?? [],
      },
    });
  } catch (error: any) {
    console.error("Error checking absence notifications:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check absence notifications",
      },
      { status: 500 }
    );
  }
}
