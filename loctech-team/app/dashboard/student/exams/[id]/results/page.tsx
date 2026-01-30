import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ExamResults from "@/components/cbt/exam-results";

async function ExamResultsPage({
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
      title: "My Exams",
      href: "/dashboard/student/exams",
    },
    {
      title: "Results",
      href: `/dashboard/student/exams/${params.id}/results`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <ExamResults examId={params.id} />
      </div>
    </AppLayout>
  );
}

export default ExamResultsPage;
