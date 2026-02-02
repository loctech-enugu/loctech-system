import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import StudentExamsList from "@/components/cbt/student-exams-list";

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: "Dashboard",
        href: "/dashboard",
    },
    {
        title: "My Exams",
        href: "/dashboard/exams",
    },
];

export default function ExamsPage() {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex flex-col gap-6 p-6">
                <div className="mb-2 flex items-center justify-between">
                    <h1 className="text-2xl font-bold">Available Exams</h1>
                </div>
                <hr />
                <StudentExamsList />
            </div>
        </AppLayout>
    );
}
