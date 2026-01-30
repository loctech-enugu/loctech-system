import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentDashboard from "@/components/student/dashboard";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Student Dashboard",
    href: "/dashboard/student",
  },
];

async function StudentDashboardPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Dashboard</h1>
        </div>
        <hr />
        <StudentDashboard />
      </div>
    </AppLayout>
  );
}

export default StudentDashboardPage;
