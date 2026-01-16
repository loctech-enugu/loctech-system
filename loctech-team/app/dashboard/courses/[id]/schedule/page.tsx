import { getCourseById } from "@/backend/controllers/courses.controller";
import AppLayout from "@/layouts/app-layout";
import { userLinks } from "@/lib/utils";
import { BreadcrumbItem } from "@/types";
import { Metadata } from "next";
import { notFound } from "next/navigation";

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
    title: "Courses",
    href: userLinks.courses,
  },
  {
    title: "Course Schedule",
    href: "#!",
  },
];

async function StaffAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const course = await getCourseById(id);

  if (!course) notFound();
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Course Schedule - {course.title}
          </h1>
          {/* <GenerateAttendanceReport /> */}
        </div>

        {/* <CalendarOfStaffAttendance /> */}
      </div>
    </AppLayout>
  );
}

export default StaffAttendancePage;
