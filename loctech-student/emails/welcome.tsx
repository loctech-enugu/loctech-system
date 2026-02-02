import { extractFirstName } from "@/lib/utils";
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import type * as React from "react";

interface WelcomeEmailProps {
  name: string;
  email: string;
  plainPassword: string;
  dashboardUrl?: string;
}

const baseUrl = process.env.NEXT_PUBLIC_MAIN_DOMAIN
  ? `https://${process.env.NEXT_PUBLIC_MAIN_DOMAIN}`
  : "http://localhost:3000";

export const WelcomeEmail = ({
  name,
  email,
  plainPassword,
  dashboardUrl,
}: WelcomeEmailProps) => {
  return (
    <Html>
      <Head />
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                brand: "#2250f4",
                offwhite: "#fafbfb",
              },
              spacing: {
                20: "20px",
                45: "45px",
              },
            },
          },
        }}
      >
        <Preview>Welcome to Loctech Training Institute</Preview>
        <Body className="bg-offwhite font-sans text-base">
          <Img
            src={`https://loctech-team.vercel.app/billboard.webp`}
            width="160"
            alt="Loctech IT Training Institute"
            className="w-full h-auto"
          />
          <Container className="bg-white p-8 rounded-lg shadow">
            <Heading className="text-center mb-6">Welcome, {name}!</Heading>

            <Text className="mb-4">
              🎉 We’re excited to have you on board. Your account has been
              successfully created.
            </Text>

            <Text className="mb-4">Here are your login details:</Text>
            <Section className="bg-gray-100 p-4 rounded-lg mb-6">
              <Text>
                <strong>Email:</strong> {email}
              </Text>
              <Text>
                <strong>Password:</strong> {plainPassword}
              </Text>
            </Section>

            <Section className="text-center mb-8">
              <Button
                href={dashboardUrl ?? baseUrl}
                className="rounded-lg bg-brand px-6 py-3 text-white"
              >
                Go to Dashboard
              </Button>
            </Section>

            <Heading as="h3" className="mb-2">
              Getting Started:
            </Heading>
            <ul className="list-disc pl-6 mb-6">
              <li>Sign in using the button above</li>
              <li>Update your profile and change your password</li>
              <li>Explore the features available to you</li>
            </ul>

            <Text className="text-sm text-gray-500">
              For your security, we recommend updating your password immediately
              after logging in.
            </Text>
          </Container>

          <Container className="mt-8">
            <Text className="mt-6 text-center text-gray-400 text-xs">
              © {new Date().getFullYear()} Loctech Training Institute
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

WelcomeEmail.PreviewProps = {
  name: extractFirstName("John Doe"),
  email: "emily.jones@loctech.com",
  plainPassword: "Demo1234",
  dashboardUrl: "https://wwrrkttn-3000.uks1.devtunnels.ms",
} as WelcomeEmailProps;

export default WelcomeEmail;
