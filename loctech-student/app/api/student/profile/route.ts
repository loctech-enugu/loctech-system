import { NextRequest, NextResponse } from "next/server";
import { getMyProfile, updateMyProfile } from "@/backend/controllers/students.controller";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function GET(req: NextRequest) {
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

    const profile = await getMyProfile(session.user.id);

    return NextResponse.json({
      success: true,
      data: profile,
    });
  } catch (error: any) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch profile",
      },
      {
        status: error.message?.includes("Unauthorized")
          ? 401
          : error.message?.includes("not found")
          ? 404
          : 500,
      }
    );
  }
}

export async function PATCH(req: NextRequest) {
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
    const updated = await updateMyProfile(session.user.id, body);

    return NextResponse.json({
      success: true,
      data: updated,
      message: "Profile updated successfully",
    });
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to update profile",
      },
      {
        status: error.message?.includes("Unauthorized")
          ? 401
          : error.message?.includes("not found")
          ? 404
          : error.message?.includes("validation")
          ? 400
          : 500,
      }
    );
  }
}
