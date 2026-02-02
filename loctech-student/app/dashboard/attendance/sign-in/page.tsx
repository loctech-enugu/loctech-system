import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentAttendanceSignIn from "@/components/student/attendance-sign-in";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Sign In Attendance",
    href: "/dashboard/attendance/sign-in",
  },
];

export default function AttendanceSignInPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Sign In Attendance</h1>
        </div>
        <hr />
        <StudentAttendanceSignIn />
      </div>
    </AppLayout>
  );
}
