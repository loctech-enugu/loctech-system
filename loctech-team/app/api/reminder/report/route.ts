import { SlackService } from "@/backend/services/slack.service";
import { errorResponse, successResponse } from "@/lib/server-helper";
import { dailyReportBlock } from "@/lib/slack-blocks";

export async function GET() {
  try {
    await SlackService.sendChannelMessage("#daily-reports", dailyReportBlock());
    return successResponse({ ok: true }, "Reminder sent successfully");
  } catch (error) {
    console.log(error);

    return errorResponse("Error Sending Reminder. . .");
  }
}
