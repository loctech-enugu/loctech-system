"use client";

import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { userLinks } from "@/lib/utils";
import EditClass from "@/components/classes/edit-class";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { SpinnerLoader } from "@/components/spinner";

async function fetchClass(id: string) {
  const res = await fetch(`/api/classes/${id}`);
  if (!res.ok) throw new Error("Failed to fetch class");
  const data = await res.json();
  return data.data;
}

export default function EditClassPage() {
  const params = useParams();
  const id = params.id as string;

  const { data: classItem, isLoading, error } = useQuery({
    queryKey: ["class", id],
    queryFn: () => fetchClass(id),
    enabled: !!id,
  });

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Classes", href: userLinks.classes },
    { title: "Edit Class", href: `/dashboard/classes/${id}/edit` },
  ];

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <SpinnerLoader title="Loading" message="Loading class details..." />
      </AppLayout>
    );
  }

  if (error || !classItem) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="p-6 text-destructive">
          {error instanceof Error ? error.message : "Class not found."}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <EditClass classId={id} classItem={classItem} />
      </div>
    </AppLayout>
  );
}
