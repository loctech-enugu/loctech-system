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
  className?: string;
  absenceStreak?: number;
  contactEmail?: string;
}

export const AbsenceNotificationEmail = ({
  studentName = "Student",
  className = "your class",
  absenceStreak = 2,
  contactEmail = "enquiries@loctechng.com",
}: AbsenceNotificationEmailProps) => {
  const previewText = `Attendance Alert - ${studentName}`;

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
            <Heading style={heading}>Attendance Alert</Heading>

            <Text style={paragraph}>Dear {studentName},</Text>

            <Text style={paragraph}>
              This is to inform you that you have missed{" "}
              <strong>{absenceStreak} consecutive class sessions</strong> for{" "}
              <strong>{className}</strong>.
            </Text>

            <Text style={paragraph}>
              Please contact your instructor or the administration if you have
              any concerns or need to discuss your attendance.
            </Text>

            <Hr style={hr} />

            <Section style={noticeSection}>
              <Text style={noticeHeading}>📋 What you can do</Text>
              <Text style={paragraph}>
                • Reach out to your instructor to discuss any challenges
              </Text>
              <Text style={paragraph}>
                • Check your class schedule and plan to attend upcoming sessions
              </Text>
              <Text style={paragraph}>
                • Contact us at{" "}
                <Link href={`mailto:${contactEmail}`} style={link}>
                  {contactEmail}
                </Link>{" "}
                if you need support
              </Text>
            </Section>

            <Text style={paragraph}>
              Best regards,
              <br />
              Loctech Training Institution
            </Text>
          </Section>

          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              © {new Date().getFullYear()} Loctech IT Training Institute. All
              rights reserved.
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

const noticeSection = {
  backgroundColor: "#fff9e6",
  border: "1px solid #ffd666",
  borderRadius: "6px",
  padding: "16px",
  marginTop: "24px",
};

const noticeHeading = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1a1a1a",
  margin: "0 0 12px 0",
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
