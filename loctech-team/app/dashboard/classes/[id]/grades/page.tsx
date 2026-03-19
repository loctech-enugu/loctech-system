import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ClassGradesTable from "@/components/classes/class-grades-table";

export default async function ClassGradesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Classes", href: "/dashboard/classes" },
    { title: "Class Grades", href: `/dashboard/classes/${id}/grades` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Class Grades</h1>
        </div>
        <hr />
        <ClassGradesTable classId={id} />
      </div>
    </AppLayout>
  );
}
