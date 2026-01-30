import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import Enrollments from "@/components/enrollments";

async function ClassEnrollmentsPage({
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
      title: "Classes",
      href: "/dashboard/classes",
    },
    {
      title: "Enrollments",
      href: `/dashboard/classes/${params.id}/enrollments`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Class Enrollments</h1>
        </div>
        <hr />
        <Enrollments classId={params.id} />
      </div>
    </AppLayout>
  );
}

export default ClassEnrollmentsPage;
