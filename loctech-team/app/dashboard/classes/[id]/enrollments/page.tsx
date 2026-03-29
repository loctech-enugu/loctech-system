import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import Enrollments from "@/components/enrollments";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";

async function ClassEnrollmentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getServerSession(authConfig);
  const canEditClass =
    session?.user?.role === "admin" || session?.user?.role === "super_admin";

  const breadcrumbs: BreadcrumbItem[] = [
    {
      title: "Dashboard",
      href: "/dashboard",
    },
    {
      title: "Classes",
      href: "/dashboard/classes",
    },
    {
      title: "Enrollments",
      href: `/dashboard/classes/${id}/enrollments`,
    },
  ];
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">Class Enrollments</h1>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/classes/${id}/assignments`}>Assignments</Link>
            </Button>
            {canEditClass && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/classes/${id}/edit`}>Edit class</Link>
              </Button>
            )}
          </div>
        </div>
        <hr />
        <Enrollments classId={id} />
      </div>
    </AppLayout>
  );
}

export default ClassEnrollmentsPage;
