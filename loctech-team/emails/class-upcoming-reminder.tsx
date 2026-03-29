import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

export interface ClassUpcomingReminderProps {
  studentName?: string;
  className?: string;
  courseTitle?: string;
  daysLine?: string;
  timeLine?: string;
  timezone?: string;
}

export const ClassUpcomingReminderEmail = ({
  studentName = "Student",
  className: classLabel = "your class",
  courseTitle = "",
  daysLine = "",
  timeLine = "",
  timezone = "",
}: ClassUpcomingReminderProps) => {
  const previewText = `Reminder: your class — ${classLabel}`;
  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Img
              src="https://loctechng.com/logo.png"
              width="150"
              height="50"
              alt="Loctech IT Training Institute"
              style={logo}
            />
          </Section>
          <Section style={content}>
            <Heading style={heading}>Upcoming class reminder</Heading>
            <Text style={paragraph}>Hello {studentName},</Text>
            <Text style={paragraph}>
              This is a friendly reminder about your upcoming sessions for{" "}
              <strong>{classLabel}</strong>
              {courseTitle ? (
                <>
                  {" "}
                  (<strong>{courseTitle}</strong>)
                </>
              ) : null}
              .
            </Text>
            <Section style={box}>
              <Text style={label}>Class days</Text>
              <Text style={value}>{daysLine}</Text>
              {timeLine ? (
                <>
                  <Text style={label}>Time</Text>
                  <Text style={value}>{timeLine}</Text>
                </>
              ) : null}
              {timezone ? (
                <Text style={muted}>Timezone: {timezone}</Text>
              ) : null}
            </Section>
            <Text style={paragraph}>
              Please arrive on time and reach out if you need to adjust your schedule.
            </Text>
            <Hr style={hr} />
            <Text style={footerText}>— Loctech Team</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ClassUpcomingReminderEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const logoSection = {
  padding: "32px 20px",
  textAlign: "center" as const,
  backgroundColor: "#1a1a1a",
};

const logo = { margin: "0 auto" };

const content = { padding: "0 48px" };

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  color: "#1a1a1a",
  marginTop: "24px",
  marginBottom: "12px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#525252",
  margin: "12px 0",
};

const box = {
  backgroundColor: "#fffbeb",
  border: "1px solid #fcd34d",
  borderRadius: "8px",
  padding: "16px",
  margin: "16px 0",
};

const label = {
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  color: "#92400e",
  margin: "0 0 4px 0",
};

const value = {
  fontSize: "16px",
  color: "#0f172a",
  margin: "0 0 12px 0",
};

const muted = {
  fontSize: "14px",
  color: "#64748b",
  margin: "8px 0 0 0",
};

const hr = { borderColor: "#e6e6e6", margin: "24px 0" };

const footerText = {
  fontSize: "14px",
  color: "#64748b",
};
