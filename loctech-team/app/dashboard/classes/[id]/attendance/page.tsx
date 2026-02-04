import { getClassById } from "@/backend/controllers/classes.controller";
import { CalendarOfClassAttendance } from "@/components/attendance/classes/calendar";
import { Button } from "@/components/ui/button";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { QrCode } from "lucide-react";
import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: "Class Attendance - LocTech",
  description: "View and manage class attendance.",
  robots: {
    index: true,
    follow: true,
  },
};

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Classes",
    href: "/dashboard/classes",
  },
  {
    title: "Attendance",
    href: "",
  },
];

async function ClassAttendancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const classItem = await getClassById(id);

  if (!classItem) notFound();

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">
              Class Attendance - {classItem.name}
            </h1>
            {classItem.course && (
              <p className="text-muted-foreground">
                Course: {classItem.course.title}
              </p>
            )}
          </div>

          <Button asChild>
            <Link href={`/dashboard/classes/${id}/attendance/codes`}>
              <QrCode className="mr-2 h-4 w-4" />
              Generate Attendance Codes
            </Link>
          </Button>
        </div>

        <CalendarOfClassAttendance classId={id} />
      </div>
    </AppLayout>
  );
}

export default ClassAttendancePage;
