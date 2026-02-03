"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";
import { Class } from "@/types";

async function fetchTodaysClasses() {
  const res = await fetch("/api/classes/instructor/me");
  if (!res.ok) throw new Error("Failed to fetch classes");
  const data = await res.json();
  return data.data || [];
}

async function fetchAtRiskStudents() {
  const res = await fetch("/api/attendance/monitoring?minAbsences=2");
  if (!res.ok) throw new Error("Failed to fetch at-risk students");
  const data = await res.json();
  return data.data || [];
}

export default function InstructorDashboard() {
  const { data: classes = [], isLoading: loadingClasses } = useQuery({
    queryKey: ["instructor-classes"],
    queryFn: fetchTodaysClasses,
  });

  const { data: atRiskStudents = [], isLoading: loadingAtRisk } = useQuery({
    queryKey: ["at-risk-students"],
    queryFn: fetchAtRiskStudents,
  });

  // Filter today's classes
  // const today = new Date().toISOString().split("T")[0];
  const todaysClasses = classes.filter((classItem: Class) => {
    // Simple check - in a real implementation, you'd check the schedule
    return classItem.status === "active";
  });

  if (loadingClasses || loadingAtRisk) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Classes</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysClasses.length}</div>
            <p className="text-xs text-muted-foreground">
              Active classes scheduled today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{classes.length}</div>
            <p className="text-xs text-muted-foreground">
              All assigned classes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At-Risk Students</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskStudents.length}</div>
            <p className="text-xs text-muted-foreground">
              Students with 2+ consecutive absences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Classes */}
      <Card>
        <CardHeader>
          <CardTitle>{`Today's Classes`}</CardTitle>
          <CardDescription>Classes scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          {todaysClasses.length > 0 ? (
            <div className="space-y-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {todaysClasses.map((classItem: any) => (
                <div
                  key={classItem.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{classItem.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {classItem.course?.title || "No course"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <Clock className="inline h-3 w-3 mr-1" />
                      {classItem.schedule || "Schedule TBD"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/instructor/classes/${classItem.id}`}>
                        View Class
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/instructor/classes/${classItem.id}/attendance`}>
                        Take Attendance
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No classes scheduled for today
            </p>
          )}
        </CardContent>
      </Card>

      {/* At-Risk Students */}
      <Card>
        <CardHeader>
          <CardTitle>At-Risk Students</CardTitle>
          <CardDescription>Students with consecutive absences requiring attention</CardDescription>
        </CardHeader>
        <CardContent>
          {atRiskStudents.length > 0 ? (
            <div className="space-y-4">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {atRiskStudents.slice(0, 10).map((item: any) => (
                <div
                  key={`${item.studentId}-${item.classId}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.student?.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.student?.email}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Class: {item.class?.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <Badge
                        className={
                          item.consecutiveAbsences >= 3
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }
                      >
                        {item.consecutiveAbsences} absences
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last: {item.lastAttendanceDate
                          ? new Date(item.lastAttendanceDate).toLocaleDateString()
                          : "Never"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/instructor/classes/${item.classId}/students/${item.studentId}`}>
                        View Details
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No at-risk students at this time
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
