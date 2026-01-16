import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { userLinks } from "@/lib/utils";
import { getAllCourses } from "@/backend/controllers/courses.controller";
import Courses from "@/components/courses";
import { notFound } from "next/navigation";
import { SyncCoursesButton } from "@/components/courses/refresh";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Courses",
    href: userLinks.courses,
  },
];
async function CoursesPage() {
  const courses = await getAllCourses();
  if (!courses) notFound();
  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="mb-2 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Courses</h1>
          <div className="flex items-center gap-2">
            {/* <AddCourseModal /> */}
            <SyncCoursesButton />
          </div>
        </div>
        <hr />
        <Courses courses={courses} />
      </div>
    </AppLayout>
  );
}

export default CoursesPage;
