"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Enrollment } from "@/types";

async function fetchClass(classId: string) {
  const res = await fetch(`/api/classes/${classId}`);
  if (!res.ok) throw new Error("Failed to fetch class");
  const data = await res.json();
  return data.data;
}

async function fetchClassAttendance(classId: string, date: string) {
  const res = await fetch(`/api/attendance/classes/${classId}/date/${date}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const data = await res.json();
  return data.data || [];
}

async function fetchEnrollments(classId: string) {
  const res = await fetch(`/api/enrollments/class/${classId}`);
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  const data = await res.json();
  return data.data || [];
}

async function recordAttendance(data: {
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent";
  method: "manual" | "pin" | "barcode";
  pin?: string;
}) {
  const res = await fetch("/api/attendance/classes/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const result = await res.json();
    throw new Error(result.error || "Failed to record attendance");
  }
  return res.json();
}

interface InstructorAttendanceViewProps {
  classId: string;
}

export default function InstructorAttendanceView({
  classId,
}: InstructorAttendanceViewProps) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = React.useState(
    new Date().toISOString().split("T")[0]
  );
  const [attendanceStatus, setAttendanceStatus] = React.useState<
    Record<string, "present" | "absent">
  >({});

  const { data: classItem } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClass(classId),
  });

  const { data: enrollments = [] } = useQuery({
    queryKey: ["enrollments", classId],
    queryFn: () => fetchEnrollments(classId),
  });

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["attendance", classId, selectedDate],
    queryFn: () => fetchClassAttendance(classId, selectedDate),
    enabled: !!classId && !!selectedDate,
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: recordAttendance,
    onSuccess: () => {
      toast.success("Attendance recorded successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to record attendance";
      toast.error(errorMessage);
    },
  });

  // Initialize attendance status from existing records
  React.useEffect(() => {
    const statusMap: Record<string, "present" | "absent"> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    attendanceRecords.forEach((record: any) => {
      if (record.student?.id) {
        statusMap[record.student.id] = record.status;
      }
    });
    setAttendanceStatus(statusMap);
  }, [attendanceRecords]);

  const handleStatusChange = (studentId: string, status: "present" | "absent") => {
    setAttendanceStatus((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSaveAttendance = () => {
    const activeEnrollments = enrollments.filter(
      (e: Enrollment) => e.status === "active"
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    activeEnrollments.forEach((enrollment: any) => {
      const studentId = enrollment.studentId || enrollment.student?.id;
      const status = attendanceStatus[studentId] || "absent";

      recordAttendanceMutation.mutate({
        studentId,
        classId,
        date: selectedDate,
        status,
        method: "manual",
      });
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>{classItem?.name || "Class Attendance"}</CardTitle>
          <CardDescription>
            Record and manage attendance for this class
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <Button onClick={handleSaveAttendance} className="mt-6">
              Save Attendance
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance List */}
      <Card>
        <CardHeader>
          <CardTitle>Students</CardTitle>
          <CardDescription>
            Mark attendance for each student
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeEnrollments.length > 0 ? (
            <div className="space-y-2">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {activeEnrollments.map((enrollment: any) => {
                const student = enrollment.student || enrollment.studentId;
                const studentId = typeof student === "string" ? student : student?.id;
                const studentName = typeof student === "string" ? "Unknown" : student?.name;
                const studentEmail = typeof student === "string" ? "" : student?.email;
                const currentStatus = attendanceStatus[studentId] || "absent";
                const existingRecord = attendanceRecords.find(
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  (r: any) => r.student?.id === studentId
                );

                return (
                  <div
                    key={enrollment.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h3 className="font-semibold">{studentName}</h3>
                      <p className="text-sm text-muted-foreground">{studentEmail}</p>
                      {existingRecord && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Recorded: {new Date(existingRecord.recordedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        value={currentStatus}
                        onValueChange={(value: "present" | "absent") =>
                          handleStatusChange(studentId, value)
                        }
                      >
                        <SelectTrigger className="w-[120px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="present">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              Present
                            </div>
                          </SelectItem>
                          <SelectItem value="absent">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              Absent
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {existingRecord && (
                        <Badge
                          variant="outline"
                          className={
                            existingRecord.method === "pin"
                              ? "bg-blue-50"
                              : existingRecord.method === "barcode"
                                ? "bg-purple-50"
                                : ""
                          }
                        >
                          {existingRecord.method}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              No active enrollments found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(attendanceStatus).filter((s) => s === "present").length}
              </div>
              <p className="text-sm text-muted-foreground">Present</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(attendanceStatus).filter((s) => s === "absent").length}
              </div>
              <p className="text-sm text-muted-foreground">Absent</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {activeEnrollments.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Students</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
