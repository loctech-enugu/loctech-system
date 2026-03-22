import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { getStudentWalkInTodayStatus } from "@/backend/controllers/walk-in-attendance.controller";

export async function GET() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const status = await getStudentWalkInTodayStatus(session.user.id);

    return NextResponse.json({
      success: true,
      data: status,
    });
  } catch (error: unknown) {
    console.error("Walk-in status error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load status",
      },
      { status: 500 }
    );
  }
}
