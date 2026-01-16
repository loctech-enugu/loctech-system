import * as z from "zod";

export const forgotPasswordSchema = z.object({
  email: z
    .email("Invalid email format")
    .min(1, "Email is required")
    .transform((email) => email.trim().toLowerCase()),
  userType: z.enum(
    ["user", "student"],
    "User type must be either 'user' or 'student'"
  ),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const verifyResetTokenSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyResetTokenInput = z.infer<typeof verifyResetTokenSchema>;
