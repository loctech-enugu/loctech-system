// app/api/announcements/route.ts
import { AnnouncementModel } from "@/backend/models/annoucement.model";
import { authConfig } from "@/lib/auth";
import { errorResponse } from "@/lib/server-helper";
import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session) return errorResponse("Please login", 401);
  console.log(req);

  const audienceFilter: string[] = ["all", "staff"];

  const announcements = await AnnouncementModel.find({
    isActive: true,
    $or: [
      { expiresAt: { $exists: false } },
      { expiresAt: { $gt: new Date() } },
    ],
    audience: { $in: audienceFilter },
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  return Response.json(announcements);
}

const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().min(1).max(2000),
  audience: z.enum(["all", "staff", "students"]),
  expiresAt: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authConfig);
  if (!session) return errorResponse("Please login", 401);
  let data;
  try {
    const body = await req.json();
    data = createAnnouncementSchema.parse(body);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  try {
    const announcement = new AnnouncementModel({
      ...data,
      author: session.user._id,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
    });

    await announcement.save();

    return Response.json(announcement, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return Response.json(
      { error: "Failed to create announcement" },
      { status: 500 }
    );
  }
}
