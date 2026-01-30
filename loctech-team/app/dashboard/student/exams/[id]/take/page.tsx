import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ExamTakingInterface from "@/components/cbt/exam-taking-interface";

async function TakeExamPage({
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
      title: "Take Exam",
      href: `/dashboard/student/exams/${params.id}/take`,
    },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <ExamTakingInterface examId={params.id} />
    </AppLayout>
  );
}

export default TakeExamPage;
