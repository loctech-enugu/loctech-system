import AppLayout from "@/layouts/app-layout";
import LearningManager from "@/components/courses/learning-manager";
import type { BreadcrumbItem } from "@/types";
import { userLinks } from "@/lib/utils";

async function CourseLearningPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Courses", href: userLinks.courses },
    { title: "Learning", href: userLinks.learning(id) },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <h1 className="text-2xl font-bold">Course Learning</h1>
        <LearningManager courseId={id} />
      </div>
    </AppLayout>
  );
}

export default CourseLearningPage;
