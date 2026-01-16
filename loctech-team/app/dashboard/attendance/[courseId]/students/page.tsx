import { getCourseById } from "@/backend/controllers/courses.controller";
import { CalendarOfStudentAttendance } from "@/components/attendance/students/calendar";
import AppLayout from "@/layouts/app-layout";
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
    title: "Student Attendance",
    href: "",
  },
];

async function UserAttendancePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseById(courseId);

  if (!course) notFound();
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold">
            Students Attendance - {course.title}
          </h1>
        </div>

        <CalendarOfStudentAttendance courseId={courseId} />
      </div>
    </AppLayout>
  );
}

export default UserAttendancePage;
