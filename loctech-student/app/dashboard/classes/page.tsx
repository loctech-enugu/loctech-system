import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentClassesList from "@/components/student/classes-list";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Classes",
    href: "/dashboard/classes",
  },
];

export default function ClassesPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">My Classes</h1>
        </div>
        <hr />
        <StudentClassesList />
      </div>
    </AppLayout>
  );
}
