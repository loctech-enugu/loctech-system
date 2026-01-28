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
import {
  useGetCourseAttendance,
  useSignInAttendance,
  useSignOutAttendance,
  useExcuseAttendance,
  useUpdateAttendance,
} from "@/hooks/use-student-attendance";
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
import { useRouter } from "next/navigation";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { StudentAttendance } from "@/types";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"


interface Props {
  isReportSheetOpen: boolean;
  handleCloseReportSheet: (open: boolean) => void;
  selectedDate: Date | null;
  courseId: string;
}

type ActionType = "signin" | "signin_late" | "signout" | "excuse" | "absent";

export const AttendanceDetails = ({
  isReportSheetOpen,
  handleCloseReportSheet,
  selectedDate,
  courseId,
}: Props) => {
  const date = selectedDate ? format(selectedDate, "yyyy-MM-dd") : undefined;

  const { data, isLoading } = useGetCourseAttendance(courseId, date);
  const students = data?.data;

  const signInMutation = useSignInAttendance();
  const signOutMutation = useSignOutAttendance();
  const excuseMutation = useExcuseAttendance();
  const updateMutation = useUpdateAttendance();

  const isSubmitting =
    signInMutation.isPending ||
    signOutMutation.isPending ||
    excuseMutation.isPending ||
    updateMutation.isPending;
  console.log(
    signInMutation.isPending,
    signOutMutation.isPending,
    excuseMutation.isPending,
    isSubmitting
  );

  const router = useRouter();

  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState("");
  const [signInTime, setSignInTime] = useState("");
  const [signOutTime, setSignOutTime] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(
    null
  );
  const [selectedAction, setSelectedAction] = useState<ActionType | null>(null);
  const [selectedAttendanceId, setSelectedAttendanceId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  const handleSubmitAction = async () => {
    if (!selectedStudentId || !selectedAction || !date) return;

    // If editing existing attendance
    if (isEditMode && selectedAttendanceId) {
      const payload: Record<string, unknown> = {
        notes: noteText,
      };

      // Map action to status
      if (selectedAction) {
        if (selectedAction === "signin") {
          payload.status = "present";
        } else if (selectedAction === "signin_late") {
          payload.status = "late";
        } else if (selectedAction === "excuse") {
          payload.status = "excused";
        } else if (selectedAction === "absent") {
          payload.status = "absent";
        } else {
          payload.status = selectedAction;
        }
      }

      if (signInTime) {
        payload.signInTime = new Date(`${date}T${signInTime}`).toISOString();
      }
      if (signOutTime) {
        payload.signOutTime = new Date(`${date}T${signOutTime}`).toISOString();
      }

      try {
        await updateMutation.mutateAsync({ id: selectedAttendanceId, ...payload });
      } catch (error) {
        console.error("Error updating attendance:", error);
      } finally {
        setIsNoteModalOpen(false);
        setNoteText("");
        setSignInTime("");
        setSignOutTime("");
        setSelectedStudentId(null);
        setSelectedAction(null);
        setSelectedAttendanceId(null);
        setIsEditMode(false);
        router.refresh();
      }
      return;
    }

    // Original create/update logic
    const payload: Record<string, unknown> = {
      studentId: selectedStudentId,
      courseId,
      date,
      notes: noteText,
    };

    if (selectedAction === "signin" || selectedAction === "signin_late") {
      payload.signInTime = signInTime
        ? new Date(`${date}T${signInTime}`)
        : new Date();
    } else if (selectedAction === "signout") {
      payload.signOutTime = signOutTime
        ? new Date(`${date}T${signOutTime}`)
        : new Date();
    }

    try {
      switch (selectedAction) {
        case "signin":
          await signInMutation.mutateAsync({ ...payload, status: "present" });
          break;
        case "signin_late":
          await signInMutation.mutateAsync({ ...payload, status: "late" });
          break;
        case "signout":
          await signOutMutation.mutateAsync(payload);
          break;
        case "excuse":
          await excuseMutation.mutateAsync({ ...payload, status: "excused" });
          break;
        case "absent":
          await signInMutation.mutateAsync({ ...payload, status: "absent" });
      }
    } catch (error) {
      console.error("Error performing attendance action:", error);
    } finally {
      setIsNoteModalOpen(false);
      setNoteText("");
      setSignInTime("");
      setSignOutTime("");
      setSelectedStudentId(null);
      setSelectedAction(null);
      setSelectedAttendanceId(null);
      setIsEditMode(false);
      router.refresh();
    }
  };

  const openNoteModal = (studentId: string, action: ActionType) => {
    setSelectedStudentId(studentId);
    setSelectedAction(action);
    setIsEditMode(false);
    setSelectedAttendanceId(null);
    setIsNoteModalOpen(true);
  };

  const openEditModal = (studentId: string, attendance: StudentAttendance) => {
    setSelectedStudentId(studentId);
    setSelectedAttendanceId(attendance.id);
    setSelectedAction(attendance.status as ActionType);
    setIsEditMode(true);

    // Pre-fill form with existing data
    if (attendance.signInTime) {
      const signInDate = new Date(attendance.signInTime);
      const hours = String(signInDate.getHours()).padStart(2, "0");
      const minutes = String(signInDate.getMinutes()).padStart(2, "0");
      setSignInTime(`${hours}:${minutes}`);
    }
    if (attendance.signOutTime) {
      const signOutDate = new Date(attendance.signOutTime);
      const hours = String(signOutDate.getHours()).padStart(2, "0");
      const minutes = String(signOutDate.getMinutes()).padStart(2, "0");
      setSignOutTime(`${hours}:${minutes}`);
    }
    setNoteText(attendance.notes || "");

    setIsNoteModalOpen(true);
  };

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
              ) : students && students.length > 0 ? (
                students.map(({ student, attendance }) => (
                  <div
                    key={student.id}
                    className={cn(
                      "flex flex-col sm:flex-row gap-2 sm:items-center justify-between p-3 rounded-md border space-y-2 sm:space-y-0",
                      attendance?.status === "present"
                        ? "border-green-200"
                        : attendance?.status === "excused"
                          ? "border-yellow-200"
                          : attendance?.status === "late"
                            ? "border-orange-200"
                            : "border-red-200"
                    )}
                  >
                    <div>
                      <h4 className="font-medium">{student.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {student.email || "No email"}
                      </p>

                      {attendance && (
                        <>
                          <p className="text-xs mt-1 text-gray-600 flex items-center gap-1">
                            <Clock size={14} />{" "}
                            {attendance.signInTime
                              ? format(
                                new Date(attendance.signInTime),
                                "hh:mm a"
                              )
                              : "—"}
                            {attendance.signOutTime && (
                              <>
                                {" "}
                                →{" "}
                                {format(
                                  new Date(attendance.signOutTime),
                                  "hh:mm a"
                                )}
                              </>
                            )}
                          </p>

                          {attendance.notes && (
                            <p className="text-xs mt-1 text-amber-600 flex items-center gap-1">
                              <FileText size={12} /> {attendance.notes}
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
                            : attendance?.status === "excused"
                              ? "outline"
                              : attendance?.status === "late"
                                ? "secondary"
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
                          onClick={() => openEditModal(student.id, attendance)}
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                      )}
                      {!attendance && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openNoteModal(student.id, "absent")}
                        >
                          <UserX size={16} className="mr-1" />
                          Absent
                        </Button>
                      )}

                      {!attendance?.signInTime ? (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openNoteModal(student.id, "signin")}
                          >
                            <UserCheck size={16} className="mr-1" />
                            Sign In
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              openNoteModal(student.id, "signin_late")
                            }
                          >
                            <Timer size={16} className="mr-1" />
                            Late
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openNoteModal(student.id, "excuse")}
                          >
                            <FileText size={16} className="mr-1" />
                            Excuse
                          </Button>
                        </>
                      ) : !attendance?.signOutTime &&
                        attendance.status != "absent" ? (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => openNoteModal(student.id, "signout")}
                        >
                          <UserX size={16} className="mr-1" />
                          Sign Out
                        </Button>
                      ) : (
                        <></>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-center text-gray-500">
                  No students found for this course
                </p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {/* Modal for Notes + Confirmation */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? "Edit Attendance"
                : selectedAction === "signin"
                  ? "Sign In Student"
                  : selectedAction === "signin_late"
                    ? "Mark as Late"
                    : selectedAction === "signout"
                      ? "Sign Out Student"
                      : selectedAction === "absent"
                        ? "Mark as Absent"
                        : "Excuse Student"}
            </DialogTitle>
          </DialogHeader>

          {isEditMode && (
            <>
              <div>
                <label className="block text-sm mb-1 text-muted-foreground">
                  Status
                </label>

                <Select value={selectedAction || ""} onValueChange={(value) => setSelectedAction(value as ActionType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Status</SelectLabel>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="excused">Excused</SelectItem>
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

          {!isEditMode && (selectedAction === "signin" ||
            selectedAction === "signin_late") && (
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

          {!isEditMode && selectedAction === "signout" && (
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
                selectedAction === "absent" && "bg-red-600 hover:bg-red-600/90"
              )}
            >
              {isSubmitting
                ? "Saving..."
                : isEditMode
                  ? "Update Attendance"
                  : selectedAction === "signin"
                    ? "Sign In"
                    : selectedAction === "signin_late"
                      ? "Mark Late"
                      : selectedAction === "signout"
                        ? "Sign Out"
                        : selectedAction === "absent"
                          ? "Mark as Absent"
                          : "Save Excuse"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
