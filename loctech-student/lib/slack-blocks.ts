export const buildReportSubmissionBlock = (
  name: string,
  reportTitle: string,
  summary: string | undefined,
  dateTimeString = new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
) => {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "📝 Daily Report Submitted",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Name:*\n${name}`,
        },
        {
          type: "mrkdwn",
          text: `*Date & Time:*\n${dateTimeString}`,
        },
        {
          type: "mrkdwn",
          text: `*Report Title:*\n${reportTitle}`,
        },
      ],
      accessory: {
        type: "image",
        image_url: "https://img.icons8.com/color/96/000000/task-completed.png",
        alt_text: "Report icon",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ":sparkles: Your report has been successfully logged.",
        },
      ],
    },
    {
      type: "divider",
    },
  ];
};

export const buildSignInBlock = (
  name: string,
  isLate = false,
  dateTimeString = new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
) => {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: isLate ? "❌ Late Attendance Recorded" : "✅ Attendance Recorded",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Name:*\n${name}`,
        },
        {
          type: "mrkdwn",
          text: `*Date & Time:*\n${dateTimeString}`,
        },
        {
          type: "mrkdwn",
          text: `*Status:*\n${
            isLate ? ":red_circle: Late" : ":green_circle: On Time"
          }`,
        },
      ],
      accessory: {
        type: "image",
        image_url: isLate
          ? "https://img.icons8.com/color/96/000000/alarm-clock.png"
          : "https://api.slack.com/img/blocks/bkb_template_images/notifications.png",
        alt_text: "Attendance icon",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: isLate
            ? "⚠️ You signed in late. Please be mindful of time."
            : ":wave: Welcome! Your sign-in has been logged.",
        },
      ],
    },
    {
      type: "divider",
    },
  ];
};

export const buildStudentRegistrationBlock = (
  name: string,
  email: string,
  phone: string,
  courseCount: number,
  dateTimeString = new Date().toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
) => {
  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: "🎓 New Student Registration",
      },
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Name:*\n${name}`,
        },
        {
          type: "mrkdwn",
          text: `*Email:*\n${email}`,
        },
        {
          type: "mrkdwn",
          text: `*Phone:*\n${phone}`,
        },
        {
          type: "mrkdwn",
          text: `*Courses Enrolled:*\n${courseCount}`,
        },
        {
          type: "mrkdwn",
          text: `*Registered At:*\n${dateTimeString}`,
        },
      ],
      accessory: {
        type: "image",
        image_url: "https://img.icons8.com/color/96/000000/graduation-cap.png",
        alt_text: "New student icon",
      },
    },
    {
      type: "context",
      elements: [
        {
          type: "mrkdwn",
          text: ":tada: A new student has successfully registered on the platform!",
        },
      ],
    },
    {
      type: "divider",
    },
  ];
};

export function dailyReportBlock() {
  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const baseUrl = process.env.NEXTAUTH_URL ?? "";

  const blocks = [
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
        text: `<!channel> Hello team! Please share your daily report for *${currentDate}*.\n\n*Please include:*\n• Tasks completed today\n• Tasks in progress\n• Blockers/Challenges\n• Plans for tomorrow`,
      },
    },
    {
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "📤 Submit Your Report",
            emoji: true,
          },
          url: `${baseUrl}/dashboard/reports`, // 🔗 Replace with your actual form or dashboard link
          style: "primary",
        },
      ],
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

  return blocks;
}
