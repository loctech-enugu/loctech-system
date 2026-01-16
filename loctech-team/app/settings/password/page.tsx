import HeadingSmall from "@/components/heading-small";
import { type BreadcrumbItem } from "@/types";
import AppLayout from "@/layouts/app-layout";
import SettingsLayout from "@/layouts/settings/layout";
import { userLinks } from "@/lib/utils";
import { UpdatePasswordForm } from "@/components/auth/password";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Update Password",
    href: userLinks.password,
  },
];

export default function PasswordPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <SettingsLayout>
        <div className="space-y-6">
          <HeadingSmall
            title="Update password"
            description="Ensure your account is using a long, random password to stay secure"
          />

          <UpdatePasswordForm />
        </div>
      </SettingsLayout>
    </AppLayout>
  );
}
