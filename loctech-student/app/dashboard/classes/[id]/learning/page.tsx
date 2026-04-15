import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ClassLearning from "@/components/student/class-learning";

export default async function ClassLearningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Classes", href: "/dashboard/classes" },
    { title: "Class", href: `/dashboard/classes/${id}` },
    { title: "Learning", href: `/dashboard/classes/${id}/learning` },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <ClassLearning classId={id} showBackLink />
      </div>
    </AppLayout>
  );
}
