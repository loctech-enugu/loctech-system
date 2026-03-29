import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ClassAssignmentsPanel from "@/components/classes/class-assignments-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function ClassAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Classes", href: "/dashboard/classes" },
    { title: "Assignments", href: `/dashboard/classes/${id}/assignments` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Assignments</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/classes/${id}/enrollments`}>Enrollments</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/classes/${id}/edit`}>Edit class</Link>
            </Button>
          </div>
        </div>
        <hr />
        <ClassAssignmentsPanel classId={id} />
      </div>
    </AppLayout>
  );
}
