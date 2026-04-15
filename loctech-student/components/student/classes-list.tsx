"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, Calendar, CheckCircle } from "lucide-react";
import Link from "next/link";
import { userLinks } from "@/lib/utils";
import { format, parse } from "date-fns";
import { SpinnerLoader } from "../spinner";

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

export default function StudentClassesList() {
  const { data: enrollments = [], isLoading: loadingEnrollments } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: fetchStudentEnrollments,
  });

  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["student-attendance"],
    queryFn: fetchStudentAttendance,
  });

  const activeEnrollments = enrollments.filter((e: { status: string }) => e.status === "active");

  if (loadingEnrollments || loadingAttendance) {
    return (
      <SpinnerLoader
        title="Loading"
        message="Please wait while we load your classes."
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Classes</CardTitle>
        <CardDescription>Classes you are enrolled in</CardDescription>
      </CardHeader>
      <CardContent>
        {activeEnrollments.length > 0 ? (
          <div className="space-y-4">
            {activeEnrollments.map((enrollment: {
              id: string;
              classId: string;
              class?: {
                name?: string;
                courseId?: string;
                schedule?: {
                  daysOfWeek?: string[];
                  startTime?: string;
                  endTime?: string;
                };
              };
            }) => {
              const classItem = enrollment.class;
              const classAttendance = attendanceRecords.filter(
                (r: { classId: string }) => r.classId === enrollment.classId
              );
              const classPresent = classAttendance.filter(
                (r: { status: string }) => r.status === "present"
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
                            ? `${classItem.schedule.daysOfWeek?.join(", ") || "Days TBD"} ${formatTimeToAMPM(classItem.schedule.startTime || "")} - ${formatTimeToAMPM(classItem.schedule.endTime || "")}`
                            : "Schedule TBD"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span>{classPercentage.toFixed(0)}% attendance</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/classes/${enrollment.classId}`}>
                        View Details
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={userLinks.classLearning(enrollment.classId)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        Learning
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
  );
}
