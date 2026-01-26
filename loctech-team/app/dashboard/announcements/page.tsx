"use client";
// app/announcements/page.tsx
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import Link from "next/link";
import { AlertCircle, Calendar, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Announcement } from "@/types";
import AppLayout from "@/layouts/app-layout";
import { userLinks } from "@/lib/utils";

// Fetcher function
async function fetchAnnouncements(): Promise<Announcement[]> {
  const res = await fetch("/api/announcements");
  if (!res.ok) {
    throw new Error("Failed to fetch announcements");
  }
  return res.json();
}

export default function AnnouncementsPage() {
  const { data, isLoading, error } = useQuery<Announcement[]>({
    queryKey: ["announcements"],
    queryFn: fetchAnnouncements,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (error) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            Failed to load announcements. Please try again later.
          </AlertDescription>
        </Alert>
      </div>
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

        {isLoading ? (
          <AnnouncementsSkeleton />
        ) : data && data.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {data.map((announcement) => (
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

// --- Components ---

function AnnouncementCard({ announcement }: { announcement: Announcement }) {
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
          <span>Admin</span>
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
const breadcrumbs = [
  {
    title: "Dashboard",
    href: "/dashboard",
  },
  {
    title: "Announcements",
    href: userLinks.announcements,
  },
];

function AnnouncementsSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6 min-h-screen">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="flex flex-col">
            <CardHeader className="pb-3 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <div className="flex items-center text-sm text-muted-foreground gap-2">
                <Skeleton className="h-3 w-16" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6 mt-2" />
              <Skeleton className="h-4 w-4/6 mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
