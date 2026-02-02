import { NextRequest, NextResponse } from "next/server";
import { AnnouncementModel } from "@/backend/models/annoucement.model";
import { authConfig } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { connectToDatabase } from "@/lib/db";

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

    await connectToDatabase();

    // Get announcements for students
    const announcements = await AnnouncementModel.find({
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } },
      ],
    })
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      data: announcements.map((ann) => ({
        id: String(ann._id),
        title: ann.title,
        content: ann.content,
        audience: ann.audience,
        author: ann.author
          ? {
            id: String((ann.author as any)._id),
            name: (ann.author as any).name,
            email: (ann.author as any).email,
          }
          : null,
        expiresAt: ann.expiresAt
          ? (ann.expiresAt as Date).toISOString()
          : null,
        createdAt: (ann.createdAt as Date).toISOString(),
        updatedAt: (ann.updatedAt as Date).toISOString(),
      })),
    });
  } catch (error: any) {
    console.error("Error fetching announcements:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch announcements",
      },
      { status: 500 }
    );
  }
}
