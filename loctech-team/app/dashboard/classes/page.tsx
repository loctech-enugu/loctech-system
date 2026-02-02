import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { userLinks } from "@/lib/utils";
import Classes from "@/components/classes";

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

async function ClassesPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Classes</h1>
        </div>
        <hr />
        <Classes />
      </div>
    </AppLayout>
  );
}

export default ClassesPage;
