import { NextRequest, NextResponse } from "next/server";
import {
  checkAndCreateAbsenceNotifications,
  checkAndCreateAtRiskNotifications,
  sendAutomatedAbsenceNotifications,
  sendAtRiskNotification,
} from "@/backend/controllers/notifications.controller";
import { connectToDatabase } from "@/lib/db";
import { NotificationModel } from "@/backend/models/notification.model";
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


    const body = await req.json();
    const classId = body.classId; // optional
    const sendEmails = body.sendEmails ?? false;

    await connectToDatabase();

    // Check and create absence notifications
    await checkAndCreateAbsenceNotifications(classId);
    // Check and create at-risk notifications
    await checkAndCreateAtRiskNotifications(classId);

    let emailResults = null;
    if (sendEmails) {
      const absenceResults = await sendAutomatedAbsenceNotifications();
      const atRiskNotifications = await NotificationModel.find({
        type: { $in: ["at_risk_attendance", "at_risk_grade"] },
        emailSent: false,
        isResolved: false,
      }).lean();
      let atRiskSent = 0;
      let atRiskFailed = 0;
      for (const n of atRiskNotifications) {
        try {
          await sendAtRiskNotification(String(n._id));
          atRiskSent++;
        } catch {
          atRiskFailed++;
        }
      }
      emailResults = {
        sent: absenceResults.sent + atRiskSent,
        failed: absenceResults.failed + atRiskFailed,
        errors: absenceResults.errors,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Notifications checked",
      data: {
        emailsSent: emailResults?.sent ?? 0,
        emailsFailed: emailResults?.failed ?? 0,
        errors: emailResults?.errors ?? [],
      },
    });
  } catch (error: unknown) {
    console.error("Error checking absence notifications:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to check absence notifications";
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
