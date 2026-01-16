// src/services/email.service.ts
import nodemailer from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import SMTPTransport from "nodemailer/lib/smtp-transport";

type SendEmailProps = {
  sender: Mail.Address;
  recipients: Mail.Address[];
  subject: string;
  message: string;
  options?: Mail.Options;
};

class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 465,
    secure: true, // true for port 465, false for 587
    pool: true,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  } as SMTPTransport.Options);

  static async send({
    sender,
    recipients,
    subject,
    message,
    options,
  }: SendEmailProps) {
    try {
      if (!recipients || recipients.length === 0) {
        throw new Error("No recipients provided.");
      }

      const mailOptions: Mail.Options =
        recipients.length > 1
          ? {
              ...options,
              from: sender,
              to: "noreply@cusorcart.com", // display sender
              bcc: recipients,
              subject,
              html: message,
            }
          : {
              ...options,
              from: sender,
              to: recipients[0],
              subject,
              html: message,
            };

      const info = await this.transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      console.error("Error sending email:", error);
      throw error;
    }
  }
}

export default EmailService;
