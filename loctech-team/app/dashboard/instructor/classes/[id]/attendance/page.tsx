import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import InstructorAttendanceView from "@/components/instructor/attendance-view";

async function InstructorAttendancePage({
  params,
}: {
  params: { id: string };
}) {
  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Instructor Dashboard",
      href: "/dashboard/instructor",
    },
    {
      title: "Attendance",
      href: `/dashboard/instructor/classes/${params.id}/attendance`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <InstructorAttendanceView classId={params.id} />
      </div>
    </AppLayout>
  );
}

export default InstructorAttendancePage;
