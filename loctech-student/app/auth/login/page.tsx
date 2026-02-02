import LoginForm from "@/components/auth/login-form";
import InstallPrompt from "@/components/pwa/install-prompt";
// import PushNotificationManager from "@/components/pwa/push-notification";
import AuthLayout from "@/layouts/auth-layout";

export const metadata = {
  title: "Login - Loctech Team",
  description: "Log in to your Loctech Team account",
};

export default function Login() {
  return (
    <AuthLayout
      title="Log in to your account"
      description="Enter your email and password below to log in"
    >
      {/* <PushNotificationManager /> */}
      <InstallPrompt />
      <LoginForm />
    </AuthLayout>
  );
}
