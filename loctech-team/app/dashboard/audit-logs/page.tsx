import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import AuditLogsTable from "@/components/audit/audit-logs-table";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Audit Logs", href: "/dashboard/audit-logs" },
];

export default function AuditLogsPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-muted-foreground">
            View system activity (super_admin only)
          </p>
        </div>
        <hr />
        <AuditLogsTable />
      </div>
    </AppLayout>
  );
}
