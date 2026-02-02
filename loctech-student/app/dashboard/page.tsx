import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentDashboard from "@/components/student/dashboard";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
    },
];

export default function DashboardPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-6 p-6">
                <StudentDashboard />
            </div>
        </AppLayout>
    );
}
