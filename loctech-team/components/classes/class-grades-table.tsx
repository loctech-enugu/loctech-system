"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { SpinnerLoader } from "@/components/spinner";

async function fetchClassGrades(classId: string) {
  const res = await fetch(`/api/classes/${classId}/grades`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch grades");
  const data = await res.json();
  return data.data ?? [];
}

export default function ClassGradesTable({ classId }: { classId: string }) {
  const { data: grades = [], isLoading } = useQuery({
    queryKey: ["class-grades", classId],
    queryFn: () => fetchClassGrades(classId),
  });

  if (isLoading) {
    return (
      <SpinnerLoader
        title="Loading"
        message="Fetching grades..."
      />
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Attendance %</TableHead>
            <TableHead>Assignment Avg</TableHead>
            <TableHead>Exam Avg</TableHead>
            <TableHead>Overall Grade</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grades.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                No grades data. Grades are calculated from attendance, assignments, and exams.
              </TableCell>
            </TableRow>
          ) : (
            grades.map((row: {
              studentId: string;
              studentName?: string;
              studentEmail?: string;
              attendancePercentage: number;
              assignmentAverage: number;
              examAverage: number;
              overallGrade: number;
              isPassing: boolean;
            }) => (
              <TableRow key={row.studentId}>
                <TableCell className="font-medium">{row.studentName || "-"}</TableCell>
                <TableCell>{row.studentEmail || "-"}</TableCell>
                <TableCell>{row.attendancePercentage.toFixed(1)}%</TableCell>
                <TableCell>{row.assignmentAverage.toFixed(1)}%</TableCell>
                <TableCell>{row.examAverage.toFixed(1)}%</TableCell>
                <TableCell>{row.overallGrade.toFixed(1)}</TableCell>
                <TableCell>
                  <Badge variant={row.isPassing ? "default" : "destructive"}>
                    {row.isPassing ? "Passing" : "At Risk"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
