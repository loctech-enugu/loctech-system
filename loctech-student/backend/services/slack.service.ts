// services/slack.service.ts
import { WebClient, KnownBlock, Block } from "@slack/web-api";

const slackToken = process.env.SLACK_BOT_TOKEN as string;

const slack = new WebClient(slackToken);

export class SlackService {
  /**
   * Send a generic message to a Slack channel
   */
  static async sendChannelMessage(
    channel: string,
    blocks: (KnownBlock | Block)[],
    text: string = "Notification"
  ) {
    try {
      const response = await slack.chat.postMessage({
        channel,
        text, // fallback for notifications / accessibility
        blocks,
      });

      return response;
    } catch (error) {
      console.error(
        "Slack sendChannelMessage error:",
        error instanceof Error ? error.message : error
      );
      throw new Error("Failed to send Slack message");
    }
  }

  /**
   * Send a formatted daily report request to the default Slack channel
   */
  static async sendDailyReportRequest() {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });

    const blocks: (KnownBlock | Block)[] = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "📝 Daily Report Request",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `<!channel> Hello team! Please share your daily report for *${currentDate}* in this thread.\n\n*Please include:*\n• Tasks completed today\n• Tasks in progress\n• Blockers/Challenges\n• Plans for tomorrow`,
        },
      },
      {
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "🕒 Please submit your report by end of day.",
          },
        ],
      },
    ];

    return this.sendChannelMessage(
      "#daily-reports",
      blocks,
      "Daily Report Reminder"
    );
  }
}
