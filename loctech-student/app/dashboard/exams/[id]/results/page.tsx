import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ExamResults from "@/components/cbt/exam-results";

async function ExamResultsPage({
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
      title: "My Exams",
      href: "/dashboard/exams",
    },
    {
      title: "Exam Results",
      href: `/dashboard/exams/${id}/results`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <ExamResults examId={id} />
      </div>
    </AppLayout>
  );
}

export default ExamResultsPage;
