import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import InstructorDashboard from "@/components/instructor/dashboard";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Instructor Dashboard",
    href: "/dashboard/instructor",
  },
];

async function InstructorDashboardPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Instructor Dashboard</h1>
        </div>
        <hr />
        <InstructorDashboard />
      </div>
    </AppLayout>
  );
}

export default InstructorDashboardPage;
