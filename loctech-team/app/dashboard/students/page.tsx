import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { userLinks } from "@/lib/utils";
import { getAllStudents } from "@/backend/controllers/students.controller";
import { notFound } from "next/navigation";
import Students from "@/components/students";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Students",
    href: userLinks.students,
  },
];
async function StudentsPage() {
  const students = await getAllStudents();

  if (!students) notFound();
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Students</h1>
        </div>
        <hr />

        <Students students={students} />
      </div>
    </AppLayout>
  );
}

export default StudentsPage;
