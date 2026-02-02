import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import AttendanceMonitoring from "@/components/attendance/monitoring";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Attendance Monitoring",
    href: "/dashboard/attendance/monitoring",
  },
];

async function AttendanceMonitoringPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Attendance Monitoring</h1>
        </div>
        <hr />
        <AttendanceMonitoring />
      </div>
    </AppLayout>
  );
}

export default AttendanceMonitoringPage;
