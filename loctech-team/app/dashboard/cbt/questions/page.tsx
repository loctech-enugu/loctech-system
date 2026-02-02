import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import QuestionsManagement from "@/components/cbt/questions-management";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Question Bank",
    href: "/dashboard/cbt/questions",
  },
];

async function QuestionsPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Question Bank</h1>
        </div>
        <hr />
        <QuestionsManagement />
      </div>
    </AppLayout>
  );
}

export default QuestionsPage;
