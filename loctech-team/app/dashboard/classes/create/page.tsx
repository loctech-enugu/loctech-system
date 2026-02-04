import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { userLinks } from "@/lib/utils";
import CreateClass from "@/components/classes/create-class";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Classes", href: userLinks.classes },
  { title: "Create Class", href: "/dashboard/classes/create" },
];

export default function CreateClassPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <CreateClass />
      </div>
    </AppLayout>
  );
}
