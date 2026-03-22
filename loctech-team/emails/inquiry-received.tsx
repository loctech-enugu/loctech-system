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

interface InquiryReceivedEmailProps {
  name?: string;
  courseOfInterest?: string;
  contactEmail?: string;
}

export const InquiryReceivedEmail = ({
  name = "Prospective Student",
  courseOfInterest = "our programs",
  contactEmail = "enquiries@loctechng.com",
}: InquiryReceivedEmailProps) => {
  const previewText = `We received your inquiry - Loctech Training Institute`;

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
            <Heading style={heading}>Thank You for Your Inquiry</Heading>

            <Text style={paragraph}>Dear {name},</Text>

            <Text style={paragraph}>
              Thank you for reaching out to Loctech Training Institute. We have
              received your inquiry regarding <strong>{courseOfInterest}</strong>.
            </Text>

            <Text style={paragraph}>
              Our team will review your message and get back to you within 1-2
              business days. We look forward to helping you with your learning
              goals.
            </Text>

            <Hr style={hr} />

            <Text style={paragraph}>
              In the meantime, feel free to explore our programs or contact us
              directly at{" "}
              <Link href={`mailto:${contactEmail}`} style={link}>
                {contactEmail}
              </Link>
              .
            </Text>

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

export default InquiryReceivedEmail;

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
