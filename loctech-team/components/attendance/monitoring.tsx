"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Mail, RefreshCw } from "lucide-react";
import { SpinnerLoader } from "../spinner";

async function fetchMonitoring() {
  const res = await fetch("/api/attendance/monitoring");
  if (!res.ok) throw new Error("Failed to fetch monitoring data");
  const data = await res.json();
  return data.data || [];
}

async function sendNotification(notificationId: string) {
  const res = await fetch(`/api/notifications/${notificationId}/send`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to send notification");
  }
  return res.json();
}

async function checkNotifications() {
  const res = await fetch("/api/notifications/automated/check", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sendEmails: false }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to check notifications");
  }
  return res.json();
}

export default function AttendanceMonitoring() {
  const queryClient = useQueryClient();

  const { data: monitoring = [], isLoading } = useQuery({
    queryKey: ["attendance-monitoring"],
    queryFn: fetchMonitoring,
  });

  const sendNotificationMutation = useMutation({
    mutationFn: sendNotification,
    onSuccess: () => {
      toast.success("Notification sent successfully");
      queryClient.invalidateQueries({ queryKey: ["attendance-monitoring"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to send notification");
    },
  });

  const checkNotificationsMutation = useMutation({
    mutationFn: checkNotifications,
    onSuccess: () => {
      toast.success("Notifications checked");
      queryClient.invalidateQueries({ queryKey: ["attendance-monitoring"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to check notifications");
    },
  });

  if (isLoading) {
    return <SpinnerLoader title="Loading" message="Please wait while we load the attendance monitoring data." />;
  }

  return (
    <div className="w-full">
      <div className="flex justify-end mb-4">
        <Button
          onClick={() => checkNotificationsMutation.mutate()}
          disabled={checkNotificationsMutation.isPending}
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Check Notifications
        </Button>
      </div>

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Last Attendance</TableHead>
              <TableHead>Consecutive Absences</TableHead>
              <TableHead>Notification Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {monitoring.length > 0 ? (
              monitoring.map((item: any) => (
                <TableRow key={`${item.studentId}-${item.classId}`}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{item.student?.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {item.student?.email}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{item.class?.name}</span>
                  </TableCell>
                  <TableCell>
                    {item.lastAttendanceDate
                      ? new Date(item.lastAttendanceDate).toLocaleDateString()
                      : "Never"}
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        item.consecutiveAbsences >= 3
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }
                    >
                      {item.consecutiveAbsences}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.notificationStatus?.notified ? (
                      <Badge className="bg-green-100 text-green-800">
                        Notified
                      </Badge>
                    ) : (
                      <Badge className="bg-gray-200 text-gray-800">
                        Pending
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {item.notificationStatus && !item.notificationStatus.notified && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (item.notificationStatus?.id) {
                            sendNotificationMutation.mutate(
                              item.notificationStatus.id
                            );
                          }
                        }}
                        disabled={sendNotificationMutation.isPending}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Notify
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No students with consecutive absences found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
