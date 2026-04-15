import AppLayout from "@/layouts/app-layout";
import { SpinnerLoader } from "@/components/spinner";

export default function ClassLearningLoading() {
  const breadcrumbs = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Classes", href: "/dashboard/classes" },
    { title: "Learning", href: "/dashboard/classes" },
  ];

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex min-h-[50vh] flex-col gap-6 p-6">
        <SpinnerLoader title="Loading" message="Loading learning content…" />
      </div>
    </AppLayout>
  );
}
