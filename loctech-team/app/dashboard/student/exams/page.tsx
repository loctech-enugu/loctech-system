import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Dashboard", href: "/dashboard" },
  { title: "Student Exams", href: "/dashboard/student/exams" },
];

/**
 * Student exams live in the student app (loctech-student), not in the staff app.
 * This page exists only to avoid broken links; staff manage exams via CBT → Exams.
 */
export default function StudentExamsPage() {
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center dark:border-amber-800 dark:bg-amber-950/30">
          <h1 className="text-xl font-semibold text-amber-800 dark:text-amber-200">
            Student exams are not available here
          </h1>
          <p className="mt-2 text-muted-foreground">
            This is the staff app. Students take exams in the student portal (
            <strong>loctech-student</strong>). To create or manage exams, use{" "}
            <a href="/dashboard/cbt/exams" className="text-primary underline">
              CBT → Exams
            </a>
            .
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
