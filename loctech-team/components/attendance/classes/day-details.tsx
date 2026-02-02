"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { UserCheck, UserX, Clock, FileText, Timer, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ClassAttendance } from "@/types";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  isReportSheetOpen: boolean;
  handleCloseReportSheet: (open: boolean) => void;
  selectedDate: Date | null;
  classId: string;
}

type ActionType = "present" | "absent";

async function fetchClassAttendanceByDate(classId: string, date: string) {
  const res = await fetch(`/api/attendance/classes/${classId}/date/${date}`);
  if (!res.ok) throw new Error("Failed to fetch attendance");
  const data = await res.json();
  return data.data || [];
}

async function recordClassAttendance(data: {
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent";
  method: "manual" | "pin" | "barcode";
  signInTime?: string;
  notes?: string;
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

async function updateClassAttendance(
  id: string,
  data: {
    status?: string;
    signInTime?: string;
    signOutTime?: string;
    notes?: string;
  },
) {
  const res = await fetch(`/api/attendance/records/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const result = await res.json();
    throw new Error(result.error || "Failed to update attendance");
  }
  return res.json();
}

export const AttendanceDetails = ({
  isReportSheetOpen,
  handleCloseReportSheet,
  selectedDate,
  classId,
}: Props) => {
  const queryClient = useQueryClient();
  const date = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ["class-attendance-date", classId, date],
    queryFn: () => fetchClassAttendanceByDate(classId, date!),
    enabled: !!classId && !!date,
  });

  const recordMutation = useMutation({
    mutationFn: recordClassAttendance,
    onSuccess: () => {
      toast.success("Attendance recorded successfully");
      // Invalidate all class attendance queries (calendar and day details)
      queryClient.invalidateQueries({ queryKey: ["class-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["class-attendance-date"] });
      // Refetch immediately to update UI
      if (classId && date) {
        queryClient.refetchQueries({
          queryKey: ["class-attendance-date", classId, date],
        });
      }
      setIsNoteModalOpen(false);
      setNoteText("");
      setSignInTime("");
      setSelectedStudentId(null);
      setSelectedAction(null);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record attendance");
      console.error("Error recording attendance:", error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateClassAttendance(id, data),
    onSuccess: () => {
      toast.success("Attendance updated successfully");
      // Invalidate all class attendance queries (calendar and day details)
      queryClient.invalidateQueries({ queryKey: ["class-attendance"] });
      queryClient.invalidateQueries({ queryKey: ["class-attendance-date"] });
      // Refetch immediately to update UI
      if (classId && date) {
        queryClient.refetchQueries({
          queryKey: ["class-attendance-date", classId, date],
        });
      }
      setIsNoteModalOpen(false);
      setNoteText("");
      setSignInTime("");
      setSignOutTime("");
      setSelectedStudentId(null);
      setSelectedAction(null);
      setSelectedAttendanceId(null);
      setIsEditMode(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update attendance");
      console.error("Error updating attendance:", error);
    },
  });

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [signInTime, setSignInTime] = useState("");
  const [signOutTime, setSignOutTime] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null,
  );
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<
    string | null
  >(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSubmitAction = async () => {
    if (!selectedStudentId || !selectedAction || !date) return;

    if (isEditMode && selectedAttendanceId) {
      const payload: Record<string, unknown> = {
        status: selectedAction,
      };

      if (signInTime) {
        payload.signInTime = new Date(`${date}T${signInTime}`).toISOString();
      }
      if (signOutTime) {
        payload.signOutTime = new Date(`${date}T${signOutTime}`).toISOString();
      }

      try {
        await updateMutation.mutateAsync({
          id: selectedAttendanceId,
          data: payload,
        });
      } catch (error) {
        // Error handling is done in mutation onError
      }
      return;
    }

    const payload = {
      studentId: selectedStudentId,
      classId,
      date,
      status: selectedAction,
      method: "manual" as const,
    };

    try {
      await recordMutation.mutateAsync(payload);
    } catch (error) {
      // Error handling is done in mutation onError
    }
  };

  const openNoteModal = (studentId: string, action: ActionType) => {
    setSelectedStudentId(studentId);
    setSelectedAction(action);
    setIsEditMode(false);
    setSelectedAttendanceId(null);
    setIsNoteModalOpen(true);
  };

  const openEditModal = (studentId: string, attendance: ClassAttendance) => {
    setSelectedStudentId(studentId);
    setSelectedAttendanceId(attendance.id);
    setSelectedAction(attendance.status as ActionType);
    setIsEditMode(true);

    if (attendance.recordedAt) {
      const recordedDate = new Date(attendance.recordedAt);
      const hours = String(recordedDate.getHours()).padStart(2, "0");
      const minutes = String(recordedDate.getMinutes()).padStart(2, "0");
      setSignInTime(`${hours}:${minutes}`);
    }
    setNoteText("");
    setSignOutTime("");

    setIsNoteModalOpen(true);
  };

  const isSubmitting = recordMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Sheet open={isReportSheetOpen} onOpenChange={handleCloseReportSheet}>
        <SheetContent className="w-full md:max-w-[50vw] xl:pt-10 space-y-6">
          <SheetHeader>
            <SheetTitle>
              {selectedDate
                ? format(selectedDate, "MMMM d, yyyy")
                : "Select Date"}
            </SheetTitle>
            <SheetDescription>
              View and manage attendance for this date
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="max-h-[70vh] px-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-lg" />
                  ))}
                </div>
              ) : attendanceRecords && attendanceRecords.length > 0 ? (
                attendanceRecords.map(
                  ({
                    student,
                    attendance,
                  }: {
                    student: { id: string; name: string; email: string | null };
                    attendance: ClassAttendance | null;
                  }) => (
                    <div
                      key={student.id}
                      className={cn(
                        "flex flex-col sm:flex-row gap-2 sm:items-center justify-between p-3 rounded-md border space-y-2 sm:space-y-0",
                        attendance?.status === "present"
                          ? "border-green-200"
                          : "border-red-200",
                      )}
                    >
                      <div>
                        <h4 className="font-medium">{student.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {student.email || "No email"}
                        </p>

                        {attendance && (
                          <>
                            {attendance.recordedAt && (
                              <p className="text-xs mt-1 text-gray-600 flex items-center gap-1">
                                <Clock size={14} />{" "}
                                {format(
                                  new Date(attendance.recordedAt),
                                  "hh:mm a",
                                )}
                              </p>
                            )}
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            attendance?.status === "present"
                              ? "default"
                              : "secondary"
                          }
                          className={cn(!attendance && "bg-muted")}
                        >
                          {attendance?.status || "pending"}
                        </Badge>
                        {attendance && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openEditModal(student.id, attendance)
                            }
                          >
                            <Edit size={16} className="mr-1" />
                            Edit
                          </Button>
                        )}
                        {!attendance && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openNoteModal(student.id, "present")
                              }
                            >
                              <UserCheck size={16} className="mr-1" />
                              Present
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() =>
                                openNoteModal(student.id, "absent")
                              }
                            >
                              <UserX size={16} className="mr-1" />
                              Absent
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ),
                )
              ) : (
                <p className="text-sm text-center text-gray-500">
                  No students found for this class
                </p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? "Edit Attendance"
                : selectedAction === "present"
                  ? "Mark as Present"
                  : "Mark as Absent"}
            </DialogTitle>
          </DialogHeader>

          {isEditMode && (
            <>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">
                  Status
                </label>
                <Select
                  value={selectedAction || ""}
                  onValueChange={(value) =>
                    setSelectedAction(value as ActionType)
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">
                  Sign In Time
                </label>
                <Input
                  type="time"
                  value={signInTime}
                  onChange={(e) => setSignInTime(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">
                  Sign Out Time
                </label>
                <Input
                  type="time"
                  value={signOutTime}
                  onChange={(e) => setSignOutTime(e.target.value)}
                />
              </div>
            </>
          )}

          {!isEditMode && selectedAction === "present" && (
            <div>
              <label className="block text-sm mb-1 text-muted-foreground">
                Sign In Time
              </label>
              <Input
                type="time"
                value={signInTime}
                onChange={(e) => setSignInTime(e.target.value)}
              />
            </div>
          )}

          {!isEditMode && selectedAction === "absent" ? (
            "Are you sure this student is absent?"
          ) : (
            <Textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add note (optional)"
            />
          )}

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitAction}
              disabled={isSubmitting}
              className={cn(
                selectedAction === "absent" && "bg-red-600 hover:bg-red-600/90",
              )}
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update Attendance"
                  : selectedAction === "present"
                    ? "Mark Present"
                    : "Mark Absent"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
