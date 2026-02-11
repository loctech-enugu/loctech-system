"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import AppLayout from "@/layouts/app-layout";
import { BreadcrumbItem } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SpinnerLoader } from "@/components/spinner";
import { ArrowLeft } from "lucide-react";

async function fetchClass(classId: string) {
  const res = await fetch(`/api/classes/${classId}`);
  if (!res.ok) throw new Error("Failed to fetch class");
  const data = await res.json();
  return data.data;
}

async function fetchStudent(studentId: string) {
  const res = await fetch(`/api/students/${studentId}`);
  if (!res.ok) throw new Error("Failed to fetch student");
  const data = await res.json();
  return data;
}

async function fetchAttendanceHistory(studentId: string, classId: string) {
  const res = await fetch(
    `/api/attendance/students/${studentId}?classId=${classId}`
  );
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const data = await res.json();
  return data.data || [];
}

export default function InstructorStudentDetailPage() {
  const params = useParams();
  const classId = params.id as string;
  const studentId = params.studentId as string;

  const { data: classItem, isLoading: loadingClass } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClass(classId),
    enabled: !!classId,
  });

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ["student", studentId],
    queryFn: () => fetchStudent(studentId),
    enabled: !!studentId,
  });

  const { data: attendance = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["attendance-history", studentId, classId],
    queryFn: () => fetchAttendanceHistory(studentId, classId),
    enabled: !!studentId && !!classId,
  });

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Dashboard", href: "/dashboard" },
    { title: "Instructor", href: "/dashboard/instructor" },
    { title: "Classes", href: "/dashboard/instructor" },
    {
      title: classItem?.name ?? "Class",
      href: `/dashboard/instructor/classes/${classId}`,
    },
    {
      title: student?.name ?? "Student",
      href: `/dashboard/instructor/classes/${classId}/students/${studentId}`,
    },
  ];

  const isLoading = loadingClass || loadingStudent;

  if (isLoading) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <SpinnerLoader title="Loading" message="Loading student details..." />
      </AppLayout>
    );
  }

  if (!classItem || !student) {
    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <div className="p-6 text-destructive">
          Class or student not found. You may not have access to this resource.
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/instructor">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Instructor Dashboard
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/dashboard/instructor/classes/${classId}/attendance`}>
              Class Attendance
            </Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Student in Class</CardTitle>
            <CardDescription>
              {student.name} in {classItem.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <p>
              <span className="font-medium">Student:</span> {student.name}
            </p>
            <p>
              <span className="font-medium">Email:</span> {student.email ?? "—"}
            </p>
            <p>
              <span className="font-medium">Class:</span> {classItem.name}
            </p>
            {classItem.course && (
              <p>
                <span className="font-medium">Course:</span>{" "}
                {typeof classItem.course === "object"
                  ? classItem.course.title
                  : "—"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Attendance History</CardTitle>
            <CardDescription>
              Recent attendance for this student in this class
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingAttendance ? (
              <p className="text-muted-foreground">Loading attendance...</p>
            ) : attendance.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record: { id: string; date: string | null; status: string; method: string; recordedAt: string | null }) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        {record.date
                          ? new Date(record.date).toLocaleDateString()
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={record.status === "present" ? "default" : "secondary"}
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.method ?? "—"}</TableCell>
                      <TableCell>
                        {record.recordedAt
                          ? new Date(record.recordedAt).toLocaleString()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">
                No attendance records yet for this student in this class.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
