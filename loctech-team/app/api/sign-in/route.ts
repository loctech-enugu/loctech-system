import { z } from "zod";
import { connectToDatabase } from "@/lib/db";
import { AttendanceModel } from "@/backend/models/attendance.model";
import { buildSignInBlock } from "@/lib/slack-blocks";
import { NextRequest, NextResponse } from "next/server";
import { extractBodyAsJson } from "@/lib/server-helper";
import { getTodaySession } from "@/lib/session";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { SlackService } from "@/backend/services/slack.service";

const slackToken = process.env.SLACK_BOT_TOKEN as string;
const slackChannel = (process.env.SLACK_SIGNIN_CHANNEL ||
  process.env.SLACK_CHANNEL_ID) as string;

// ✅ Allow either `code` or (`qrSecret` + optional `qrSession`)
const bodySchema = z.object({
  code: z.string().optional(),
  qrSecret: z.string().optional(),
  qrSession: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();

    const session = await getServerSession(authConfig);
    if (!session) {
      return NextResponse.json({ error: "Please Login" }, { status: 401 });
    }

    // Parse JSON body
    const body = await extractBodyAsJson(req);
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const { code, qrSecret, qrSession } = parsed.data;

    // ✅ Must have at least one form of authentication
    if (!code && !qrSecret) {
      return NextResponse.json(
        { error: "Either 'code' or 'qrSecret' must be provided" },
        { status: 400 }
      );
    }

    // Validate today's QR session
    const todaySession = await getTodaySession();
    if (!todaySession) {
      return NextResponse.json(
        { error: "No active session found for today" },
        { status: 404 }
      );
    }

    // ✅ Validate sign-in (support both modes)
    const isCodeValid = code && code === todaySession.code;
    const isQRValid =
      qrSecret === todaySession.secret &&
      (!qrSession || qrSession === todaySession.session);

    if (code && !isCodeValid) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 401 }
      );
    }
    if (qrSecret && !isQRValid) {
      return NextResponse.json(
        { error: "QR validation failed" },
        { status: 401 }
      );
    }

    // --- Lagos Time ---
    const utcNow = new Date();
    const lagosNow = new Date();

    const lagosDateString = lagosNow.toLocaleDateString("en-CA", {
      timeZone: "Africa/Lagos",
    });

    // Create 8:10 AM in Lagos timezone (Lagos is UTC+1, so 8:10 AM Lagos = 7:10 AM UTC)
    const eightTenAM = new Date(`${lagosDateString}T07:10:00.000Z`);
    // const eightTenAM = new Date(lagosNow);
    // eightTenAM.setHours(8, 10, 0, 0);

    console.log(lagosNow, eightTenAM);

    const isLate = lagosNow > eightTenAM;

    // Prevent duplicates
    const checkRecord = await AttendanceModel.findOne({
      user: session.user.id,
      session: todaySession.id ?? "",
    });
    console.log("checkRecord", checkRecord);

    if (checkRecord) {
      return NextResponse.json(
        { error: "You have already signed in for this session" },
        { status: 409 }
      );
    }

    // Save record (UTC in DB)
    const record = await AttendanceModel.create({
      user: session.user.id,
      validated: true,
      session: todaySession.id ?? "",
      isLate,
      time: utcNow, // always UTC
    });

    const name = session.user.name;

    // --- Slack Notification ---
    if (slackToken && slackChannel) {
      const lagosTimeString = lagosNow.toLocaleString("en-NG", {
        timeZone: "Africa/Lagos",
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      await SlackService.sendChannelMessage(
        slackChannel,
        buildSignInBlock(name, isLate, lagosTimeString)
      );
    }

    return NextResponse.json({ ok: true, id: record._id });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
