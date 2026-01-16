import { NextResponse } from "next/server";
import { ScholarshipReminderEmail } from "@/emails/ScholarshipReminderEmail";
import { render } from "@react-email/render";
import { students } from "@/assets/students";
import EmailService from "@/backend/services/email.service";
import { errorResponse } from "@/lib/server-helper";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const student = students.find((s) => s.id === id);
  if (!student) {
    return NextResponse.json(
      { success: false, message: "Student not found" },
      { status: 404 }
    );
  }

  const html = await render(
    ScholarshipReminderEmail({
      name: student.name,
      email: student.email,
      location: student.location,
      preferredExamTime: student.preferredExamTime,
      courseOfInterest: student.courseOfInterest,
    })
  );

  const result = await EmailService.send({
    sender: {
      name: "Loctech IT Training Institute",
      address: "no-reply@cusorcart.com",
    },
    recipients: [
      {
        name: student.name,
        address: student.email,
      },
    ],
    subject: "Reminder: Loctech Scholarship Exam – 1st Nov, 2025",
    message: html,
  });

  if (!result.accepted || result.accepted.length === 0) {
    //   throw new Error("Failed to send welcome email");
    return errorResponse("Failed to send welcome email");
  }

  return NextResponse.json({
    success: true,
    message: "Notification email sent",
  });
}
