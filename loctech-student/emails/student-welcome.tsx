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

interface StudentWelcomeEmailProps {
  name: string;
  email: string;
  plainPassword: string;
  loginUrl: string;
}

const baseUrl =
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "http://localhost:3001";

export const StudentWelcomeEmail = ({
  name,
  email,
  plainPassword,
  loginUrl,
}: StudentWelcomeEmailProps) => {
  const portalUrl = loginUrl || `${baseUrl}/auth/login`;

  return (
    <Html>
      <Head />
      <Preview>Welcome to Loctech Student Portal – Your login details</Preview>
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
            <Heading style={heading}>Welcome, {name}!</Heading>

            <Text style={paragraph}>
              Your student account has been successfully created at Loctech
              Training Institute.
            </Text>

            <Text style={paragraph}>
              Here are your login details for the student portal:
            </Text>

            <Section style={credentialsBox}>
              <Text style={credentialsText}>
                <strong>Email:</strong> {email}
              </Text>
              <Text style={credentialsText}>
                <strong>Password:</strong> {plainPassword}
              </Text>
            </Section>

            <Text style={paragraph}>
              Click the button below to access your student portal and sign in:
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={portalUrl}>
                Go to Student Portal
              </Button>
            </Section>

            <Text style={smallText}>
              Or copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>
              <Link href={portalUrl} style={link}>
                {portalUrl}
              </Link>
            </Text>

            <Hr style={hr} />

            <Heading as="h3" style={subheading}>
              Getting Started:
            </Heading>
            <ul style={list}>
              <li>Sign in using the credentials above</li>
              <li>Update your profile and change your password for security</li>
              <li>View your classes and attendance</li>
            </ul>

            <Section style={securityNotice}>
              <Text style={securityHeading}>🔒 Security Notice</Text>
              <Text style={paragraph}>
                For your security, we recommend changing your password
                immediately after your first login. Keep your login details
                private and never share them with anyone.
              </Text>
            </Section>
          </Section>

          <Section style={footer}>
            <Hr style={hr} />
            <Text style={footerText}>
              Loctech IT Training Institute
              <br />
              © {new Date().getFullYear()} All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default StudentWelcomeEmail;

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

const credentialsBox = {
  backgroundColor: "#f4f4f5",
  borderRadius: "6px",
  padding: "20px",
  margin: "24px 0",
};

const credentialsText = {
  fontSize: "16px",
  lineHeight: "1.6",
  color: "#1a1a1a",
  margin: "8px 0",
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

const hr = {
  borderColor: "#e6e6e6",
  margin: "24px 0",
};

const subheading = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#1a1a1a",
  margin: "24px 0 12px 0",
};

const list = {
  fontSize: "16px",
  lineHeight: "1.8",
  color: "#525252",
  margin: "0 0 0 20px",
  padding: "0",
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
