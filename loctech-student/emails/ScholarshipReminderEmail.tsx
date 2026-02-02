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

interface ScholarshipReminderEmailProps {
  name: string;
  email: string;
  location: string;
  preferredExamTime: string;
  courseOfInterest: string;
  dashboardUrl?: string;
}

export const ScholarshipReminderEmail = ({
  name,
  preferredExamTime,
  courseOfInterest,
}: ScholarshipReminderEmailProps) => {
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
            },
          },
        }}
      >
        <Preview>Reminder: Loctech Scholarship Exam – Saturday, Nov 1</Preview>
        <Body className="bg-offwhite font-sans text-base">
          <Img
            src={`https://loctech-team.vercel.app/billboard.webp`}
            width="160"
            alt="Loctech IT Training Institute"
            className="w-full h-auto"
          />

          <Container className="bg-white p-8 rounded-lg shadow">
            <Heading className="text-center mb-6 text-brand">
              Scholarship Exam Reminder
            </Heading>

            <Text className="mb-4">Hi {name.split(" ")[0]}, 👋</Text>

            <Text className="mb-4">
              This is a friendly reminder that your{" "}
              <strong>Loctech 2025 Scholarship Exam</strong> is scheduled for:
            </Text>

            <Section className="bg-gray-100 p-4 rounded-lg mb-6">
              <Text>
                <strong>Date:</strong> Saturday, 1st November
              </Text>
              <Text>
                <strong>Preferred Time:</strong> {preferredExamTime}
              </Text>
              <Text>
                <strong>Location:</strong>{" "}
                <a
                  href="https://maps.app.goo.gl/gmFsPjoP4tEYGcwU7"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Loctech IT Training Institute, 54A Liberty Estate Phase 1,
                  Independent Layout, Opp. IMT, Enugu.
                </a>
              </Text>
              <Text>
                <strong>Course of Interest:</strong> {courseOfInterest}
              </Text>
            </Section>

            <Text className="mb-4">
              Please arrive at least <strong>15 minutes early</strong> to
              complete your verification and setup. Remember to bring a valid ID
              and any other required materials.
            </Text>

            <Text className="mb-4">
              To review your details or take a{" "}
              <a
                href="https://loctech-scholarship.vercel.app/practice-test"
                target="_blank"
                rel="noopener noreferrer"
              >
                practice test
              </a>
              , visit your candidate dashboard:
            </Text>

            <Section className="text-center mb-8">
              <Button
                href={"https://cbt.loctechng.com/student/login"}
                className="rounded-lg bg-brand px-6 py-3 text-white"
              >
                Go to Dashboard
              </Button>
            </Section>

            <Text className="text-gray-600 mb-4">
              We wish you the best of luck — stay confident and focused!
            </Text>

            {/* Signature Section */}
            <Section className="mt-8 pt-6 border-t border-gray-200">
              <Text className="mb-1" style={{ margin: 0 }}>
                Best regards,
              </Text>
              <Text className="font-semibold mb-1" style={{ margin: 0 }}>
                Signed: Branch Manager
              </Text>
              <Text className="text-sm text-gray-600" style={{ margin: 0 }}>
                09030952792
              </Text>
            </Section>

            <Text className="mt-6 text-sm text-gray-500">
              If you have any questions, email{" "}
              <a href="mailto:enquiries@loctechng.com">
                enquiries@loctechng.com
              </a>{" "}
              or message us on{" "}
              <a href="https://wa.me/message/K4BIU6BK5NBTF1">09030952792</a>.
            </Text>
          </Container>

          <Container className="mt-8">
            <Text className="mt-6 text-center text-gray-400 text-xs">
              © {new Date().getFullYear()} Loctech IT Training Institute. All
              rights reserved.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

ScholarshipReminderEmail.PreviewProps = {
  name: extractFirstName("Emily Johnson"),
  email: "emily.johnson@example.com",
  location: "Loctech IT Training Institute, Enugu",
  preferredExamTime: "10:00 AM",
  courseOfInterest: "Web Development",
  dashboardUrl: "https://cbt.loctechng.com/",
} as ScholarshipReminderEmailProps;

export default ScholarshipReminderEmail;
