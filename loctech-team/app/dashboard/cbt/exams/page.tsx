import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ExamsManagement from "@/components/cbt/exams-management";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "CBT Exams",
    href: "/dashboard/cbt/exams",
  },
];

async function CBTExamsPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Exam Management</h1>
        </div>
        <hr />
        <ExamsManagement />
      </div>
    </AppLayout>
  );
}

export default CBTExamsPage;
