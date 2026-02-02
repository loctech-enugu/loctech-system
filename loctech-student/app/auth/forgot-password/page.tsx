import ForgotPWForm from "@/components/auth/forgot-password";
import TextLink from "@/components/text-link";
import AuthLayout from "@/layouts/auth-layout";
import { authLinks } from "@/lib/utils";

export const metadata = {
  title: "Forgot Password - Loctech Team",
  description: "Reset your Loctech Team account password",
};

function ForgotPassword() {
  return (
    <AuthLayout
      title="Forgot password"
      description="Enter your email to receive a password reset link"
    >
      <div className="space-y-6">
        <ForgotPWForm />

        <div className="space-x-1 text-center text-sm text-muted-foreground">
          <span>Or, return to</span>
          <TextLink href={authLinks.login}>log in</TextLink>
        </div>
      </div>
    </AuthLayout>
  );
}

export default ForgotPassword;
