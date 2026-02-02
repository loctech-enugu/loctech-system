import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentClassView from "@/components/student/class-view";

async function ClassPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Class Details",
      href: `/dashboard/classes/${id}`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <StudentClassView classId={id} />
      </div>
    </AppLayout>
  );
}

export default ClassPage;
