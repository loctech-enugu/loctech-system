import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";

interface AbsenceNotificationEmailProps {
  studentName?: string;
  /** Kept for API compatibility; body copy uses the Slack-approved template. */
  className?: string;
  absenceStreak?: number;
  contactEmail?: string;
}

export const AbsenceNotificationEmail = ({
  studentName = "Student",
  contactEmail = "loctechenugu@gmail.com",
}: AbsenceNotificationEmailProps) => {
  const previewText = `Attendance notice — ${studentName}`;

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
            <Heading style={heading}>Attendance</Heading>

            <Text style={paragraph}>Hello {studentName},</Text>

            <Text style={paragraph}>
              You have missed your classes for several consecutive weeks. Kindly send an email to{" "}
              <Link href={`mailto:${contactEmail}`} style={link}>
                {contactEmail}
              </Link>{" "}
              requesting that your classes be placed on hold. This will enable us to properly manage
              your schedule until you are ready to resume. Thank you for your cooperation.
            </Text>

            <Hr style={hr} />

            <Text style={paragraph}>— Loctech Team</Text>
          </Section>

          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              © {new Date().getFullYear()} Loctech IT Training Institute. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AbsenceNotificationEmail;

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

const logo = {
  margin: "0 auto",
};

const content = {
  padding: "0 48px",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  color: "#1a1a1a",
  marginTop: "32px",
  marginBottom: "16px",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#525252",
  margin: "16px 0",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const link = {
  color: "#0066cc",
  textDecoration: "underline",
};

const footer = {
  padding: "0 48px",
  marginTop: "32px",
};

const footerText = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#a3a3a3",
  textAlign: "center" as const,
  margin: "16px 0 0 0",
};
