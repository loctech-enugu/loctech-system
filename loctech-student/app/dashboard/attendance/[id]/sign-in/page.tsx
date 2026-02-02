import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import ClassAttendanceSignIn from "@/components/student/class-attendance-sign-in";

async function ClassAttendanceSignInPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: "Dashboard",
            href: "/dashboard",
        },
        {
            title: "Sign In Attendance",
            href: `/dashboard/attendance/${id}/sign-in`,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <ClassAttendanceSignIn enrollmentId={id} />
        </AppLayout>
    );
}

export default ClassAttendanceSignInPage;
