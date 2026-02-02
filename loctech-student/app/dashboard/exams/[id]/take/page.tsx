import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ExamTakingInterface from "@/components/cbt/exam-taking-interface";

async function TakeExamPage({
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
      title: "Take Exam",
      href: `/dashboard/exams/${id}/take`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <ExamTakingInterface examId={id} />
    </AppLayout>
  );
}

export default TakeExamPage;
