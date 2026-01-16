// ReportDetails.tsx
"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { Clock, Eye, UserCheck, UserX } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { StaffAttendance } from "@/types";
import { useDisclosure } from "@/hooks/use-disclosure";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Optional: A detail viewer for attendance
function ViewAttendance({
  attendance,
  open,
  onOpenChange,
}: {
  attendance: StaffAttendance | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!attendance) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] xl:pt-10">
        <SheetHeader>
          <SheetTitle>Attendance Details</SheetTitle>
          <SheetDescription>
            Recorded attendance details for {attendance.user.name}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 px-4 space-y-4 text-sm">
          <p>
            <strong>Name:</strong> {attendance.user.name}
          </p>
          <p>
            <strong>Email:</strong> {attendance.user.email}
          </p>
          <p>
            <strong>Role:</strong> {attendance.user.role}
          </p>
          <p>
            <strong>Time:</strong>{" "}
            {attendance.time ? format(new Date(attendance.time), "p") : "N/A"}
          </p>
          <p>
            <strong>Session Date:</strong> {attendance.session.dateKey}
          </p>
          <p>
            <strong>Status:</strong> {attendance.isLate ? "Late" : "On Time"}
          </p>
          <p>
            <strong>Excused:</strong>{" "}
            {attendance.isExcused
              ? `Yes (by ${attendance.excusedBy || "N/A"})`
              : "No"}
          </p>
          <p>
            <strong>Created At:</strong>{" "}
            {format(new Date(attendance.createdAt), "PPP p")}
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface Props {
  isReportSheetOpen: boolean;
  handleCloseReportSheet: (open: boolean) => void;
  selectedDate: Date | null;
  selectedDateReports: StaffAttendance[];
}

export const ReportDetails = ({
  isReportSheetOpen,
  handleCloseReportSheet,
  selectedDate,
  selectedDateReports,
}: Props) => {
  const [selectedAttendance, setSelectedAttendance] =
    useState<StaffAttendance | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleViewAttendance = (attendance: StaffAttendance) => {
    setSelectedAttendance(attendance);
    onOpen();
  };

  return (
    <>
      <Sheet open={isReportSheetOpen} onOpenChange={handleCloseReportSheet}>
        <SheetContent className="w-[400px] sm:w-[540px] xl:pt-10">
          <SheetHeader>
            <SheetTitle>
              {selectedDate
                ? format(selectedDate, "MMMM d, yyyy")
                : "Select Date"}
            </SheetTitle>
            <SheetDescription>
              {selectedDate
                ? "View and manage attendance for this date"
                : "Click on a date to view records"}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="max-h-[80vh] px-4">
            <div className="mt-6 space-y-4">
              {selectedDate ? (
                selectedDateReports.length === 0 ? (
                  <p className="text-gray-500 text-sm p-6">
                    No Attendance Recorded
                  </p>
                ) : (
                  selectedDateReports.map((attendance) => (
                    <div
                      key={attendance.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {attendance.user.name}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {attendance.user.email}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewAttendance(attendance)}
                            title="View"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>
                            {attendance.time
                              ? format(new Date(attendance.time), "p")
                              : "N/A"}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {attendance.isLate ? (
                            <UserX className="w-3 h-3 text-red-500" />
                          ) : (
                            <UserCheck className="w-3 h-3 text-green-500" />
                          )}
                          <span>{attendance.isLate ? "Late" : "On Time"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          className={cn(
                            attendance.isExcused
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800",
                            "capitalize"
                          )}
                        >
                          {attendance.isExcused ? "Excused" : "Present"}
                        </Badge>
                        {attendance.excusedBy && (
                          <span className="text-xs text-gray-500">
                            Excused by {attendance.excusedBy}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )
              ) : (
                <p className="text-gray-500 text-sm">Click to view</p>
              )}
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      {selectedAttendance && (
        <ViewAttendance
          attendance={selectedAttendance}
          open={isOpen}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
};
