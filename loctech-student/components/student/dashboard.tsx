"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Calendar, CheckCircle, LogIn, LogOut, XCircle } from "lucide-react";
import Link from "next/link";
import { format, parse } from "date-fns";
import { SpinnerLoader } from "../spinner";
import { getGreeting, userLinks } from "@/lib/utils";
import { toast } from "sonner";

function formatTimeToAMPM(time: string): string {
  if (!time) return "";
  const parsed = parse(time, "HH:mm", new Date());
  return format(parsed, "h:mm a");
}

async function fetchStudentEnrollments() {
  const res = await fetch("/api/enrollments/student/me", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  const data = await res.json();
  return data.data || [];
}

async function fetchStudentAttendance() {
  const res = await fetch("/api/attendance/students/me", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const data = await res.json();
  return data.data || [];
}

async function fetchWalkInStatus() {
  const res = await fetch("/api/attendance/walk-in/me", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch walk-in status");
  const data = await res.json();
  return data.data as {
    active: boolean;
    recordId: string | null;
    signInTime: string | null;
    signOutTime: string | null;
  };
}

export default function StudentDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const queryClient = useQueryClient();

  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: fetchStudentEnrollments,
  });

  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["student-attendance"],
    queryFn: fetchStudentAttendance,
  });

  const { data: walkInStatus, isLoading: walkInLoading } = useQuery({
    queryKey: ["walk-in-status"],
    queryFn: fetchWalkInStatus,
    enabled: sessionStatus === "authenticated",
    staleTime: 60 * 1000,
  });

  const signOutWalkInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/walk-in/sign-out", {
        method: "POST",
        credentials: "include",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to sign out");
      return result;
    },
    onSuccess: () => {
      toast.success("Walk-in sign-out recorded");
      queryClient.invalidateQueries({ queryKey: ["walk-in-status"] });
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to sign out");
    },
  });

  // Calculate attendance stats
  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");
  const totalSessions = attendanceRecords.length;
  const presentSessions = attendanceRecords.filter((r: any) => r.status === "present").length;
  const attendancePercentage = totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

  if (loadingEnrollments || loadingAttendance) {
    return (
      <SpinnerLoader
        title="Loading"
        message="Please wait while we load the dashboard."
      />
    );
  }

  const greeting =
    session?.user?.name != null
      ? getGreeting(session.user.name)
      : { greeting: "Welcome", message: "Good to see you." };

  return (
    <div className="space-y-6">
      {/* Greeting + walk-in */}
      {sessionStatus === "authenticated" && session?.user && (
        <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-muted/30 p-6 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
                {greeting.greeting}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{greeting.message}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {walkInLoading ? (
                <Button size="sm" variant="outline" disabled>
                  Checking walk-in…
                </Button>
              ) : walkInStatus?.active ? (
                <>
                  <Badge variant="secondary" className="font-normal">
                    Walk-in: signed in
                  </Badge>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={signOutWalkInMutation.isPending}
                    onClick={() => signOutWalkInMutation.mutate()}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Walk-in sign out
                  </Button>
                </>
              ) : (
                <Button size="sm" asChild>
                  <Link href={userLinks.walkInSignIn}>
                    <LogIn className="mr-2 h-4 w-4" />
                    Walk-in sign in
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enrolled Classes</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeEnrollments.length}</div>
            <p className="text-xs text-muted-foreground">
              Active class enrollments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {presentSessions} of {totalSessions} sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Absences</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalSessions - presentSessions}
            </div>
            <p className="text-xs text-muted-foreground">
              Total absences recorded
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Classes */}
      <Card>
        <CardHeader>
          <CardTitle>My Classes</CardTitle>
          <CardDescription>Classes you are enrolled in</CardDescription>
        </CardHeader>
        <CardContent>
          {activeEnrollments.length > 0 ? (
            <div className="space-y-4">
              {activeEnrollments.map((enrollment: any) => {
                const classItem = enrollment.class;
                const classAttendance = attendanceRecords.filter(
                  (r: any) => r.classId === enrollment.classId
                );
                const classPresent = classAttendance.filter(
                  (r: any) => r.status === "present"
                ).length;
                const classTotal = classAttendance.length;
                const classPercentage =
                  classTotal > 0 ? (classPresent / classTotal) * 100 : 0;

                return (
                  <div
                    key={enrollment.id}
                    className="flex items-center flex-col md:flex-row gap-4 md:gap-0 justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{classItem?.name || "Unknown Class"}</h3>
                      <p className="text-sm text-muted-foreground">
                        {enrollment.class?.courseId || "No course"}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {classItem?.schedule
                              ? `${classItem.schedule.daysOfWeek?.join(", ") || "Days TBD"} ${formatTimeToAMPM(classItem.schedule.startTime)} - ${formatTimeToAMPM(classItem.schedule.endTime)}`
                              : "Schedule TBD"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-sm">
                          <CheckCircle className="h-3 w-3 text-green-600" />
                          <span>{classPercentage.toFixed(0)}% attendance</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/classes/${enrollment.classId}`}>
                          View Details
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/attendance/${enrollment.id}/sign-in`}>
                          Sign In
                        </Link>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              You are not enrolled in any classes
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Attendance</CardTitle>
          <CardDescription>Your recent attendance records</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-2">
              {attendanceRecords.slice(0, 10).map((record: any) => (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium">{record.class?.name || "Unknown Class"}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(record.date).toLocaleDateString()} at{" "}
                      {new Date(record.recordedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge
                    className={
                      record.status === "present"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }
                  >
                    {record.status === "present" ? (
                      <CheckCircle className="mr-1 h-3 w-3" />
                    ) : (
                      <XCircle className="mr-1 h-3 w-3" />
                    )}
                    {record.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No attendance records found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
