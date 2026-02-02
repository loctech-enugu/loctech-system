import React from "react";
import {
  Body,
  Button,
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

interface ForgotPasswordEmailProps {
  name?: string;
  email?: string;
  resetLink?: string;
  expirationTime?: string;
}

export const ForgotPasswordEmail = ({
  name = "User",
  email = "user@example.com",
  resetLink = "https://loctechng.com/reset-password?token=example-token",
  expirationTime = "1 hour",
}: ForgotPasswordEmailProps) => {
  const previewText = `Reset your Loctech password`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Section */}
          <Section style={logoSection}>
            <Img
              src="https://loctechng.com/logo.png"
              width="150"
              height="50"
              alt="Loctech IT Training Institute"
              style={logo}
            />
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>Password Reset Request</Heading>

            <Text style={paragraph}>Hello {name},</Text>

            <Text style={paragraph}>
              We received a request to reset the password for your Loctech
              account associated with <strong>{email}</strong>.
            </Text>

            <Text style={paragraph}>
              If you made this request, click the button below to reset your
              password:
            </Text>

            {/* Reset Button */}
            <Section style={buttonContainer}>
              <Button style={button} href={resetLink}>
                Reset Password
              </Button>
            </Section>

            <Text style={paragraph}>
              This link will expire in <strong>{expirationTime}</strong>. If you
              need a new link, please submit another password reset request.
            </Text>

            <Hr style={hr} />

            {/* Alternative Link */}
            <Text style={smallText}>
              If the button above doesn't work, copy and paste this link into
              your browser:
            </Text>
            <Text style={linkText}>
              <Link href={resetLink} style={link}>
                {resetLink}
              </Link>
            </Text>

            <Hr style={hr} />

            {/* Security Notice */}
            <Section style={securityNotice}>
              <Text style={securityHeading}>🔒 Security Notice</Text>
              <Text style={paragraph}>
                If you didn't request a password reset, please ignore this
                email. Your password will remain unchanged.
              </Text>
              <Text style={paragraph}>
                For security reasons, never share this link with anyone. Loctech
                staff will never ask for your password.
              </Text>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              Need help? Contact us at{" "}
              <Link href="mailto:enquiries@loctechng.com" style={footerLink}>
                enquiries@loctechng.com
              </Link>
            </Text>
            <Text style={footerText}>
              Loctech IT Training Institute
              <br />
              Lagos, Nigeria
            </Text>
            <Text style={footerSmallText}>
              © {new Date().getFullYear()} Loctech IT Training Institute. All
              rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ForgotPasswordEmail;

// Styles
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

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#0066cc",
  borderRadius: "6px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 40px",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const smallText = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#737373",
  margin: "8px 0",
};

const linkText = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#0066cc",
  wordBreak: "break-all" as const,
  margin: "8px 0",
};

const link = {
  color: "#0066cc",
  textDecoration: "underline",
};

const securityNotice = {
  backgroundColor: "#fff9e6",
  border: "1px solid #ffd666",
  borderRadius: "6px",
  padding: "16px",
  marginTop: "24px",
};

const securityHeading = {
  fontSize: "16px",
  fontWeight: "bold",
  color: "#1a1a1a",
  margin: "0 0 12px 0",
};

const footer = {
  padding: "0 48px",
  marginTop: "32px",
};

const footerText = {
  fontSize: "14px",
  lineHeight: "1.5",
  color: "#737373",
  textAlign: "center" as const,
  margin: "8px 0",
};

const footerLink = {
  color: "#0066cc",
  textDecoration: "underline",
};

const footerSmallText = {
  fontSize: "12px",
  lineHeight: "1.5",
  color: "#a3a3a3",
  textAlign: "center" as const,
  margin: "16px 0 0 0",
};
