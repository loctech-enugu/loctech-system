"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { ClassAttendance } from "@/types";

async function fetchClass(classId: string) {
  const res = await fetch(`/api/classes/${classId}`);
  if (!res.ok) throw new Error("Failed to fetch class");
  const data = await res.json();
  return data.data;
}

async function fetchClassAttendance(classId: string) {
  const res = await fetch(`/api/attendance/students/me?classId=${classId}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const data = await res.json();
  return data.data || [];
}

interface StudentClassViewProps {
  classId: string;
}

export default function StudentClassView({ classId }: StudentClassViewProps) {
  const { data: classItem, isLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClass(classId),
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["student-attendance", classId],
    queryFn: () => fetchClassAttendance(classId),
    enabled: !!classId,
  });

  if (isLoading) {
    return <div>Loading class details...</div>;
  }

  if (!classItem) {
    return <div>Class not found</div>;
  }

  const totalSessions = attendanceRecords.length;
  const presentSessions = attendanceRecords.filter(
    (r: ClassAttendance) => r.status === "present"
  ).length;
  const attendancePercentage =
    totalSessions > 0 ? (presentSessions / totalSessions) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{classItem.name}</CardTitle>
              <CardDescription>
                {classItem.course?.title || "No course assigned"}
              </CardDescription>
            </div>
            <Badge
              className={
                classItem.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-200 text-gray-800"
              }
            >
              {classItem.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Schedule:</strong> {classItem.schedule || "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Instructor:</strong> {classItem.instructor?.name || "TBD"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {presentSessions}
              </div>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {totalSessions - presentSessions}
              </div>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {attendancePercentage.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Attendance Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance History</CardTitle>
          <CardDescription>Your attendance records for this class</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-2">
              {attendanceRecords.map(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (record: any) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">
                        {format(record.date, "MM/dd/yyyy")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Recorded at {new Date(record.recordedAt).toLocaleTimeString()}
                        {record.method && ` via ${record.method}`}
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
              No attendance records found for this class
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
