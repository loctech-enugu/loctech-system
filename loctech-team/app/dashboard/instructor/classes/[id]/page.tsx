import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import InstructorClassView from "@/components/instructor/class-view";

async function InstructorClassPage({
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
      title: "Class Details",
      href: `/dashboard/instructor/classes/${params.id}`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <InstructorClassView classId={params.id} />
      </div>
    </AppLayout>
  );
}

export default InstructorClassPage;
