import LoginForm from "@/components/auth/login-form";
import InstallPrompt from "@/components/pwa/install-prompt";
// import PushNotificationManager from "@/components/pwa/push-notification";
import AuthLayout from "@/layouts/auth-layout";
import seedUsers from "@/scripts/seed-users";

export const metadata = {
  title: "Login - Loctech Team",
  description: "Log in to your Loctech Team account",
};

export default function Login() {
  seedUsers();
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
