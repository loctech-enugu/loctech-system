import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import SignInForm from "@/components/dashboard/sign-in";
import { userLinks } from "@/lib/utils";
import { getTodayAttendance } from "@/backend/controllers/staff-attendance.controller";
import { CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Sign in",
    href: userLinks.signIn,
  },
];
export default async function SignIn() {
  const attendance = await getTodayAttendance();

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      {/* <Head title="Dashboard" /> */}
      <div className="flex flex-col gap-6 p-6">
        {attendance ? (
          <Card className="max-w-md mx-auto text-center border-emerald-100 shadow-sm">
            <CardHeader>
              <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-500" />
              <CardTitle className="text-emerald-600 text-lg font-semibold">
                You’re all set for today!
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Great job, {attendance.user?.name?.split(" ")[0] || "Staff"} 🎉
                You’ve successfully signed in for{" "}
                <span className="font-medium text-foreground">
                  {new Date(attendance.time).toLocaleDateString()}
                </span>
                .
              </p>
              <Button asChild variant="outline">
                <a href="/dashboard">Go to Dashboard</a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <SignInForm />
        )}
      </div>
    </AppLayout>
  );
}
