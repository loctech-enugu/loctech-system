import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY as string;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY in environment variables");
}
console.log(resendApiKey);

const resend = new Resend(resendApiKey);

export type SendEmailProps = {
  from: string; // e.g. "Acme <onboarding@resend.dev>"
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
};

export class ResendService {
  /**
   * Send email via Resend
   */
  static async sendEmail(props: SendEmailProps) {
    try {
      const response = await resend.emails.send({
        from: props.from,
        to: props.to,
        subject: props.subject,
        html: props.html,
        text: props.text,
        cc: props.cc,
        bcc: props.bcc,
      });

      if (response.error) {
        console.error("Resend sendEmail error:", response.error);
        throw new Error(response.error.message);
      }

      return response;
    } catch (error) {
      console.error(
        "ResendService sendEmail exception:",
        error instanceof Error && error.message
      );
      throw new Error("Failed to send email");
    }
  }
}
