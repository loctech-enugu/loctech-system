import { CalendarOfStaffAttendance } from "@/components/attendance/staff/calendar";
import GenerateAttendanceReport from "@/components/attendance/staff/generateReport";
import AppLayout from "@/layouts/app-layout";
import { userLinks } from "@/lib/utils";
import { BreadcrumbItem } from "@/types";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Staff Attendance - LocTech",
  description: "Submit your daily reports to the LocTech team.",
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: "Reports - LocTech",
    description: "Submit your daily reports to the LocTech team.",
    // url: "https://cusorcart.com/how-to-stay-safe",
    type: "website",
  },
};
const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Staff Attendance",
    href: userLinks.attendance.staff,
  },
];

async function StaffAttendancePage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Staff Attendance</h1>
          <GenerateAttendanceReport />
        </div>

        <CalendarOfStaffAttendance />
      </div>
    </AppLayout>
  );
}

export default StaffAttendancePage;
