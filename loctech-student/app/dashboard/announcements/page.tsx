"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { AlertCircle, Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { SpinnerLoader } from "@/components/spinner";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Announcements",
    href: "/dashboard/announcements",
  },
];

async function fetchAnnouncements() {
  const res = await fetch("/api/announcements");
  if (!res.ok) {
    throw new Error("Failed to fetch announcements");
  }
  const data = await res.json();
  return data.data || [];
}

export default function AnnouncementsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="container py-8 space-y-8 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">
              Important updates from Loctech
            </p>
          </div>
          <SpinnerLoader
            title="Loading"
            message="Please wait while we load the announcements."
          />
        </div >
      </AppLayout >
    );
  }

  if (error) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="container py-8 space-y-8 p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
            <p className="text-muted-foreground">
              Important updates from Loctech
            </p>
          </div>
          <div className="container py-8">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Failed to load announcements. Please try again later.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="container py-8 space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
          <p className="text-muted-foreground">
            Important updates from Loctech
          </p>
        </div>

        {data && data.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((announcement: any) => (
              <AnnouncementCard
                key={announcement.id}
                announcement={announcement}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                No announcements at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

function AnnouncementCard({ announcement }: { announcement: any }) {
  const getAudienceBadgeVariant = (audience: string) => {
    switch (audience) {
      case "staff":
        return "secondary";
      case "students":
        return "outline";
      default:
        return "default";
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <CardTitle className="line-clamp-2">{announcement.title}</CardTitle>
          <Badge variant={getAudienceBadgeVariant(announcement.audience)}>
            {announcement.audience === "all"
              ? "All"
              : announcement.audience === "staff"
                ? "Staff"
                : "Students"}
          </Badge>
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-2 gap-2">
          <User className="h-3.5 w-3.5" />
          <span>{announcement.author?.name || "Admin"}</span>
          <Calendar className="h-3.5 w-3.5 ml-2" />
          <span>{format(new Date(announcement.createdAt), "MMM d, yyyy")}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0 mt-auto">
        <CardDescription className="line-clamp-4">
          {announcement.content}
        </CardDescription>
      </CardContent>
    </Card>
  );
}
