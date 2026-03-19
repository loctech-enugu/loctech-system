import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import WalkInAttendance from "@/components/attendance/walk-in-attendance";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Attendance", href: "/dashboard/attendance/monitoring" },
  { title: "Walk-in Front Desk", href: "/dashboard/attendance/walk-in" },
];

export default function WalkInPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Walk-in Front Desk</h1>
          <p className="text-sm text-muted-foreground">
            Manage walk-in attendance: barcode sign-in, staff-assisted sign-in, and sign-out
          </p>
        </div>
        <hr />
        <WalkInAttendance />
      </div>
    </AppLayout>
  );
}
