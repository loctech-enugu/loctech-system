import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentClassView from "@/components/student/class-view";

async function StudentClassPage({
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
      title: "Student Dashboard",
      href: "/dashboard/student",
    },
    {
      title: "Class Details",
      href: `/dashboard/student/classes/${params.id}`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <StudentClassView classId={params.id} />
      </div>
    </AppLayout>
  );
}

export default StudentClassPage;
