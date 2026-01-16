import { NextRequest, NextResponse } from "next/server";

import { PasswordResetService } from "../services/passwordReset.service";
import { z } from "zod";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyResetTokenSchema,
} from "@/types/passwordReset.schema";

export class PasswordResetController {
  /**
   * POST /api/auth/forgot-password
   * Request password reset
   */
  static async forgotPassword(req: NextRequest) {
    try {
      const body = await req.json();

      // Validate input
      const validatedData = forgotPasswordSchema.parse(body);

      // Process request
      const result = await PasswordResetService.forgotPassword(validatedData);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error("Forgot password error:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation error",
            errors: error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to process password reset request",
        },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/auth/verify-reset-token
   * Verify if reset token is valid
   */
  static async verifyResetToken(req: NextRequest) {
    try {
      const body = await req.json();

      // Validate input
      const validatedData = verifyResetTokenSchema.parse(body);

      // Verify token
      const result = await PasswordResetService.verifyResetToken(
        validatedData.token
      );

      if (!result.valid) {
        return NextResponse.json(
          {
            valid: false,
            message: "Invalid or expired reset token",
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          valid: true,
          email: result.email,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Verify reset token error:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            valid: false,
            message: "Validation error",
            errors: error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          valid: false,
          message: "Failed to verify reset token",
        },
        { status: 500 }
      );
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using token
   */
  static async resetPassword(req: NextRequest) {
    try {
      const body = await req.json();

      // Validate input
      const validatedData = resetPasswordSchema.parse(body);

      // Reset password
      const result = await PasswordResetService.resetPassword(validatedData);

      if (!result.success) {
        return NextResponse.json(result, { status: 400 });
      }

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error("Reset password error:", error);

      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            message: "Validation error",
            errors: error,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: "Failed to reset password",
        },
        { status: 500 }
      );
    }
  }
}
