import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { signOutWalkInSelf } from "@/backend/controllers/walk-in-attendance.controller";

export async function POST() {
  try {
    const session = await getServerSession(authConfig);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const result = await signOutWalkInSelf(session.user.id);

    return NextResponse.json({
      success: true,
      message: result.message,
    });
  } catch (error: unknown) {
    console.error("Walk-in sign-out error:", error);
    const message = error instanceof Error ? error.message : "Failed to sign out";
    return NextResponse.json(
      { success: false, error: message },
      {
        status:
          message.includes("not found") || message.includes("Already") || message.includes("Not signed")
            ? 400
            : 500,
      }
    );
  }
}
