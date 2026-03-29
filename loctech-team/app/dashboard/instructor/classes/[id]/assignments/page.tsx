import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ClassAssignmentsPanel from "@/components/classes/class-assignments-panel";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function InstructorClassAssignmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Instructor", href: "/dashboard/instructor" },
    { title: "Class", href: `/dashboard/instructor/classes/${id}` },
    { title: "Assignments", href: `/dashboard/instructor/classes/${id}/assignments` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Assignments</h1>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/instructor/classes/${id}`}>Back to class</Link>
          </Button>
        </div>
        <hr />
        <ClassAssignmentsPanel classId={id} />
      </div>
    </AppLayout>
  );
}
