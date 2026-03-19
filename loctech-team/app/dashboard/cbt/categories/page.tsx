import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import CategoriesManagement from "@/components/cbt/categories-management";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "CBT",
    href: "/dashboard/cbt/questions",
  },
  {
    title: "Categories",
    href: "/dashboard/cbt/categories",
  },
];

async function CategoriesPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Question Categories</h1>
        </div>
        <hr />
        <CategoriesManagement />
      </div>
    </AppLayout>
  );
}

export default CategoriesPage;
