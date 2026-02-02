import crypto from "crypto";
import { render } from "@react-email/render";
import {
  ForgotPasswordInput,
  ResetPasswordInput,
} from "@/types/passwordReset.schema";
import { connectToDatabase } from "@/lib/db";
import { UserModel } from "../models/user.model";
import { StudentModel } from "../models/students.model";
import { PasswordResetTokenModel } from "../models/password-reset-token.model";
import ForgotPasswordEmail from "@/emails/forgot-password";
import { ResendService } from "./resend.service";
import mongoose from "mongoose";
import { hashPassword } from "@/lib/auth";

export class PasswordResetService {
  private static readonly TOKEN_EXPIRY_HOURS = 1;
  private static readonly FRONTEND_URL =
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  /**
   * Generate a secure random token
   */
  private static generateToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  /**
   * Get user by email and type
   */
  private static async getUserByEmail(
    email: string,
    userType: "user" | "student"
  ) {
    await connectToDatabase();

    if (userType === "user") {
      return await UserModel.findOne({ email, isActive: true });
    } else {
      return await StudentModel.findOne({ email, status: "active" });
    }
  }

  /**
   * Send forgot password email
   */
  public static async forgotPassword(data: ForgotPasswordInput): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const { email, userType } = data;

      // Check if user exists
      const user = await this.getUserByEmail(email, userType);

      // Always return success to prevent email enumeration attacks
      if (!user) {
        console.log(
          `Password reset requested for non-existent email: ${email}`
        );
        return {
          success: true,
          message:
            "If an account exists with this email, you will receive password reset instructions.",
        };
      }

      // Generate reset token
      const token = this.generateToken();
      const expiresAt = new Date(
        Date.now() + this.TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      );

      // Delete any existing tokens for this email
      await PasswordResetTokenModel.deleteMany({ email, userType });

      // Create new token
      await PasswordResetTokenModel.create({
        email,
        token,
        userType,
        expiresAt,
        used: false,
      });

      // Generate reset link
      const resetLink = `${this.FRONTEND_URL}/auth/reset-password?token=${token}`;

      // Prepare email data
      const userName = user.name || "User";
      const html = await render(
        ForgotPasswordEmail({
          name: userName,
          email,
          resetLink,
          expirationTime: `${this.TOKEN_EXPIRY_HOURS} hour${this.TOKEN_EXPIRY_HOURS > 1 ? "s" : ""}`,
        })
      );

      // Send email
      const fromDomain = process.env.RESEND_DOMAIN ?? "";
      if (!fromDomain) {
        throw new Error("RESEND_DOMAIN environment variable is not set");
      }

      const from = `hello@${fromDomain}`;
      const result = await ResendService.sendEmail({
        from: `Loctech Training Institution <${from}>`,
        to: `${userName} <${email}>`,
        subject: "Reset Your Loctech Password",
        html,
      });

      if (!result || result.error != null) {
        console.error("Failed to send password reset email", {
          email,
          error: result?.error,
        });
        throw new Error("Failed to send password reset email");
      }

      console.log(`Password reset email sent to: ${email}`);

      return {
        success: true,
        message:
          "If an account exists with this email, you will receive password reset instructions.",
      };
    } catch (error) {
      console.error("Error in forgotPassword:", error);
      throw new Error("Failed to process password reset request");
    }
  }

  /**
   * Verify reset token validity
   */
  public static async verifyResetToken(token: string): Promise<{
    valid: boolean;
    email?: string;
    userType?: "user" | "student";
  }> {
    try {
      await connectToDatabase();

      const resetToken = await PasswordResetTokenModel.findOne({
        token,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetToken) {
        return { valid: false };
      }

      return {
        valid: true,
        email: resetToken.email,
        userType: resetToken.userType,
      };
    } catch (error) {
      console.error("Error verifying reset token:", error);
      return { valid: false };
    }
  }

  /**
   * Reset password using token
   */
  public static async resetPassword(data: ResetPasswordInput): Promise<{
    success: boolean;
    message: string;
  }> {
    let session: mongoose.ClientSession | null = null;

    try {
      const { token, newPassword } = data;

      await connectToDatabase();

      // Verify token
      const tokenData = await this.verifyResetToken(token);
      if (!tokenData.valid || !tokenData.email || !tokenData.userType) {
        return {
          success: false,
          message: "Invalid or expired reset token",
        };
      }

      // Start transaction
      session = await mongoose.startSession();
      session.startTransaction();

      // Hash new password
      const passwordHash = await hashPassword(newPassword);

      // Update user password
      let updateResult;
      if (tokenData.userType === "user") {
        updateResult = await UserModel.updateOne(
          { email: tokenData.email },
          { $set: { passwordHash } },
          { session }
        );
      } else {
        updateResult = await StudentModel.updateOne(
          { email: tokenData.email },
          { $set: { passwordHash } },
          { session }
        );
      }

      if (updateResult.matchedCount === 0) {
        await session.abortTransaction();
        return {
          success: false,
          message: "User not found",
        };
      }

      // Mark token as used
      await PasswordResetTokenModel.updateOne(
        { token },
        { $set: { used: true } },
        { session }
      );

      // Commit transaction
      await session.commitTransaction();

      console.log(`Password successfully reset for: ${tokenData.email}`);

      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Error resetting password:", error);
      if (session) {
        await session.abortTransaction();
      }
      throw new Error("Failed to reset password");
    } finally {
      if (session) {
        session.endSession();
      }
    }
  }

  /**
   * Clean up expired tokens (can be run as a cron job)
   */
  public static async cleanupExpiredTokens(): Promise<number> {
    try {
      await connectToDatabase();
      const result = await PasswordResetTokenModel.deleteMany({
        expiresAt: { $lt: new Date() },
      });
      console.log(`Cleaned up ${result.deletedCount} expired tokens`);
      return result.deletedCount;
    } catch (error) {
      console.error("Error cleaning up expired tokens:", error);
      return 0;
    }
  }
}
