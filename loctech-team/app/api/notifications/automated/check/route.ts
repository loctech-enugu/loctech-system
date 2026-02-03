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
