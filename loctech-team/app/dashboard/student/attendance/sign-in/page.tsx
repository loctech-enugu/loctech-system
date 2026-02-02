import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentAttendanceSignIn from "@/components/student/attendance-sign-in";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Student Dashboard",
    href: "/dashboard/student",
  },
  {
    title: "Sign In Attendance",
    href: "/dashboard/student/attendance/sign-in",
  },
];

async function StudentAttendanceSignInPage() {
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

export default StudentAttendanceSignInPage;
