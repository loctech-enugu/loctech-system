"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import AuthLayout from "@/layouts/auth-layout";
import { SpinnerLoader } from "@/components/spinner";
import { authLinks } from "@/lib/utils";
import { PasswordInput } from "@/components/password-input";

interface ResetPasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

interface ValidationError {
  field: string;
  message: string;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [token, setToken] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [formData, setFormData] = useState<ResetPasswordFormData>({
    newPassword: "",
    confirmPassword: "",
  });

  // Verify token on mount
  useEffect(() => {
    const tokenParam = searchParams.get("token");

    if (!tokenParam) {
      setIsVerifying(false);
      setError("No reset token provided. Please check your email link.");
      return;
    }

    setToken(tokenParam);
    verifyToken(tokenParam);
  }, [searchParams]);

  // Verify token validity
  const verifyToken = async (tokenToVerify: string) => {
    try {
      const response = await fetch("/api/auth/verify-reset-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenToVerify }),
      });

      const data = await response.json();

      if (data.valid) {
        setIsValidToken(true);
        setEmail(data.email || "");
      } else {
        setError(data.message || "Invalid or expired reset token");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("Failed to verify reset token. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => prev.filter((err) => err.field !== name));
  };

  // Validate form
  const validateForm = (): boolean => {
    const errors: ValidationError[] = [];

    if (formData.newPassword.length < 8) {
      errors.push({
        field: "newPassword",
        message: "Password must be at least 8 characters",
      });
    }

    if (!/(?=.*[a-z])/.test(formData.newPassword)) {
      errors.push({
        field: "newPassword",
        message: "Password must contain at least one lowercase letter",
      });
    }

    if (!/(?=.*[A-Z])/.test(formData.newPassword)) {
      errors.push({
        field: "newPassword",
        message: "Password must contain at least one uppercase letter",
      });
    }

    if (!/(?=.*\d)/.test(formData.newPassword)) {
      errors.push({
        field: "newPassword",
        message: "Password must contain at least one number",
      });
    }

    if (formData.newPassword !== formData.confirmPassword) {
      errors.push({
        field: "confirmPassword",
        message: "Passwords do not match",
      });
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push(authLinks.login);
        }, 3000);
      } else {
        setError(data.message || "Failed to reset password");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get field error
  const getFieldError = (field: string) => {
    return validationErrors.find((err) => err.field === field)?.message;
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <SpinnerLoader
              title="Verifying Reset Link"
              message="Please wait while we verify your request..."
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid token state
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl">Invalid Reset Link</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full"
              onClick={() => router.push(authLinks.forgot_password)}
            >
              Request New Reset Link
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push(authLinks.login)}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">
              Password Reset Successful!
            </CardTitle>
            <CardDescription>
              Your password has been successfully reset. You can now log in with
              your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Redirecting to login page...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main form
  return (
    <AuthLayout
      title="Reset Your Password"
      description={
        email
          ? `Enter a new password for ${email}`
          : "Enter your new password below"
      }
    >
      <div className="space-y-6">
        <div>
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Form */}
          <div className="space-y-6">
            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Enter your new password"
                className={getFieldError("newPassword") ? "border-red-500" : ""}
              />
              {validationErrors
                .filter((err) => err.field === "newPassword")
                .map((err, idx) => (
                  <p key={idx} className="text-sm text-red-600">
                    {err.message}
                  </p>
                ))}
              <p className="text-xs text-gray-500">
                Password must be at least 8 characters with uppercase,
                lowercase, and number
              </p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className={
                  getFieldError("confirmPassword") ? "border-red-500" : ""
                }
              />
              {getFieldError("confirmPassword") && (
                <p className="text-sm text-red-600">
                  {getFieldError("confirmPassword")}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Resetting Password...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{" "}
              <button
                onClick={() => router.push("/login")}
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to Login
              </button>
            </p>
          </div>

          {/* Security Notice */}
          <Alert className="mt-6">
            <AlertDescription className="text-xs text-center">
              🔒 For your security, this reset link will expire in 1 hour and
              can only be used once.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AuthLayout>
    // <div className="min-h-screen flex items-center justify-center p-4">
    //   <Card className="w-full max-w-md">
    //     <CardHeader className="text-center">
    //       <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4">
    //         <Lock className="h-8 w-8 text-blue-600" />
    //       </div>
    //       <CardTitle className="text-3xl">Reset Your Password</CardTitle>
    //       <CardDescription>
    //         {email ? (
    //           <>
    //             Enter a new password for{" "}
    //             <span className="font-medium">{email}</span>
    //           </>
    //         ) : (
    //           "Enter your new password below"
    //         )}
    //       </CardDescription>
    //     </CardHeader>

    //     <CardContent>
    //       {/* Error Alert */}
    //       {error && (
    //         <Alert variant="destructive" className="mb-6">
    //           <AlertCircle className="h-4 w-4" />
    //           <AlertDescription>{error}</AlertDescription>
    //         </Alert>
    //       )}

    //       {/* Form */}
    //       <div className="space-y-6">
    //         {/* New Password */}
    //         <div className="space-y-2">
    //           <Label htmlFor="newPassword">New Password</Label>
    //           <div className="relative">
    //             <Input
    //               id="newPassword"
    //               name="newPassword"
    //               type={showPassword ? "text" : "password"}
    //               value={formData.newPassword}
    //               onChange={handleChange}
    //               placeholder="Enter your new password"
    //               className={
    //                 getFieldError("newPassword") ? "border-red-500" : ""
    //               }
    //             />
    //             <button
    //               type="button"
    //               onClick={() => setShowPassword(!showPassword)}
    //               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    //             >
    //               {showPassword ? (
    //                 <EyeOff className="h-5 w-5" />
    //               ) : (
    //                 <Eye className="h-5 w-5" />
    //               )}
    //             </button>
    //           </div>
    //           {validationErrors
    //             .filter((err) => err.field === "newPassword")
    //             .map((err, idx) => (
    //               <p key={idx} className="text-sm text-red-600">
    //                 {err.message}
    //               </p>
    //             ))}
    //           <p className="text-xs text-gray-500">
    //             Password must be at least 8 characters with uppercase,
    //             lowercase, and number
    //           </p>
    //         </div>

    //         {/* Confirm Password */}
    //         <div className="space-y-2">
    //           <Label htmlFor="confirmPassword">Confirm Password</Label>
    //           <div className="relative">
    //             <Input
    //               id="confirmPassword"
    //               name="confirmPassword"
    //               type={showConfirmPassword ? "text" : "password"}
    //               value={formData.confirmPassword}
    //               onChange={handleChange}
    //               placeholder="Confirm your new password"
    //               className={
    //                 getFieldError("confirmPassword") ? "border-red-500" : ""
    //               }
    //             />
    //             <button
    //               type="button"
    //               onClick={() => setShowConfirmPassword(!showConfirmPassword)}
    //               className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
    //             >
    //               {showConfirmPassword ? (
    //                 <EyeOff className="h-5 w-5" />
    //               ) : (
    //                 <Eye className="h-5 w-5" />
    //               )}
    //             </button>
    //           </div>
    //           {getFieldError("confirmPassword") && (
    //             <p className="text-sm text-red-600">
    //               {getFieldError("confirmPassword")}
    //             </p>
    //           )}
    //         </div>

    //         {/* Submit Button */}
    //         <Button
    //           type="button"
    //           onClick={handleSubmit}
    //           disabled={isSubmitting}
    //           className="w-full"
    //         >
    //           {isSubmitting ? (
    //             <>
    //               <Loader2 className="h-5 w-5 animate-spin mr-2" />
    //               Resetting Password...
    //             </>
    //           ) : (
    //             "Reset Password"
    //           )}
    //         </Button>
    //       </div>

    //       {/* Footer */}
    //       <div className="mt-6 text-center">
    //         <p className="text-sm text-gray-600">
    //           Remember your password?{" "}
    //           <button
    //             onClick={() => router.push("/login")}
    //             className="font-medium text-blue-600 hover:text-blue-500"
    //           >
    //             Back to Login
    //           </button>
    //         </p>
    //       </div>

    //       {/* Security Notice */}
    //       <Alert className="mt-6">
    //         <AlertDescription className="text-xs text-center">
    //           🔒 For your security, this reset link will expire in 1 hour and
    //           can only be used once.
    //         </AlertDescription>
    //       </Alert>
    //     </CardContent>
    //   </Card>
    // </div>
  );
}

// ============================================
// REQUIRED SHADCN COMPONENTS
// ============================================

/*
Install these shadcn/ui components:

npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add alert
npx shadcn@latest add card

Or manually create them in your components/ui directory
*/
