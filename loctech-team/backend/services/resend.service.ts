import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY as string;

if (!resendApiKey) {
  throw new Error("Missing RESEND_API_KEY in environment variables");
}

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

/**
 * Default "from" for Loctech transactional mail (inquiry auto-replies, notifications, etc.)
 */
export function getTransactionalFrom(): string {
  const fromDomain = process.env.RESEND_DOMAIN ?? "";
  return fromDomain
    ? `Loctech Training Institution <hello@${fromDomain}>`
    : process.env.EMAIL_FROM || "Loctech <noreply@loctech.com>";
}

/**
 * Public-facing enquiries / reply address shown in templates and used as Reply-To when appropriate
 */
export function getContactInboxAddress(): string {
  return process.env.EMAIL_FROM || "enquiries@loctechng.com";
}

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
        replyTo: props.replyTo,
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
