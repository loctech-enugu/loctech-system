"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { UserCheck, UserX, Clock, FileText, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  useGetCourseAttendance,
  useSignInAttendance,
  useSignOutAttendance,
  useExcuseAttendance,
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

  const isSubmitting =
    signInMutation.isPending ||
    signOutMutation.isPending ||
    excuseMutation.isPending;
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

  const handleSubmitAction = async () => {
    if (!selectedStudentId || !selectedAction || !date) return;

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
      router.refresh();
    }
  };

  const openNoteModal = (studentId: string, action: ActionType) => {
    setSelectedStudentId(studentId);
    setSelectedAction(action);
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
              {selectedAction === "signin"
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

          {(selectedAction === "signin" ||
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

          {selectedAction === "signout" && (
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

          {selectedAction === "absent" ? (
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
