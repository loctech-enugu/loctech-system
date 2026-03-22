import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import InquiriesTable from "@/components/inquiries/inquiries-table";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Inquiries", href: "/dashboard/inquiries" },
];

export default function InquiriesPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Inquiries</h1>
          <a
            href="/inquiry"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline"
          >
            View public form →
          </a>
        </div>
        <hr />
        <InquiriesTable />
      </div>
    </AppLayout>
  );
}
