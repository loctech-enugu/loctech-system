"use client";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  isToday,
  startOfMonth,
  startOfWeek,
  endOfWeek,
  isSameMonth,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { SpinnerLoader } from "../spinner";

import { useGetReports } from "@/hooks/use-calendar";
import { ReportDetails } from "./ReportDetails"; // <-- new component like EventDetails

export const CalendarOfReports = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const startDate = format(startOfMonth(currentDate), "yyyy-MM-dd");
  const endDate = format(endOfMonth(currentDate), "yyyy-MM-dd");

  const [isReportSheetOpen, setIsReportSheetOpen] = useState(false);

  const { data, isPending } = useGetReports(startDate, endDate);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });

  const getReportsForDate = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return (
      data?.data?.filter(
        (report) => format(new Date(report.date), "yyyy-MM-dd") === dateStr
      ) || []
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (date: Date, isOutsideMonth: boolean) => {
    if (isOutsideMonth) {
      if (date < startOfMonth(currentDate)) {
        setCurrentDate(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
        );
      } else if (date > endOfMonth(currentDate)) {
        setCurrentDate(
          (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
        );
      }
      return;
    }
    setSelectedDate(date);
    setIsReportSheetOpen(true);
  };

  const selectedDateReports = selectedDate
    ? getReportsForDate(selectedDate)
    : [];

  if (isPending)
    return (
      <SpinnerLoader
        title="Loading"
        message="Please wait while we load the report calendar."
      />
    );

  return (
    <>
      <Card>
        <CardHeader className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousMonth}
            className="flex items-center space-x-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="hidden md:inline">Previous</span>
          </Button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="flex items-center space-x-2"
          >
            <span className="hidden md:inline">Next</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-7 gap-1 mb-4">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-2 text-center text-sm font-medium text-gray-500"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              const dayReports = getReportsForDate(day);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isCurrentDay = isToday(day);
              const isOutsideMonth = !isSameMonth(day, monthStart);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => handleDateClick(day, isOutsideMonth)}
                  className={cn(
                    "p-2 md:min-h-[120px] border cursor-pointer hover:bg-gray-50 transition-colors dark:hover:bg-background/80",
                    isSelected &&
                      "bg-green-50 border-green-200 dark:bg-green-900 dark:border-green-600",
                    isCurrentDay &&
                      "bg-green-100 border-green-300 dark:bg-green-950 dark:border-green-700",
                    isOutsideMonth &&
                      "bg-white text-gray-300 dark:bg-background/50 dark:text-gray-600"
                  )}
                >
                  <div
                    className={cn(
                      "text-sm font-medium mb-1",
                      isCurrentDay && "text-green-600 font-bold",
                      isOutsideMonth && "text-gray-300"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  <div className="space-y-1 hidden md:block">
                    {dayReports.slice(0, 2).map((report) => (
                      <div
                        key={report.id}
                        className="text-xs px-1 py-0.5 rounded truncate bg-green-500 text-white"
                      >
                        {report.user.name} ({report.status})
                      </div>
                    ))}
                    {dayReports.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayReports.length - 2} more
                      </div>
                    )}
                  </div>

                  {dayReports.length > 0 && (
                    <div className="gap-0.5 centered p-0 md:hidden">
                      {dayReports.slice(0, 1).map((attendance, i) => (
                        <div
                          key={i}
                          className={cn(
                            "size-2 aspect-square block rounded-full",
                            attendance.isLate && "bg-red-500",
                            !attendance.isLate && "bg-green-500"
                          )}
                        />
                      ))}

                      {dayReports.length > 1 && (
                        <div className="text-xs text-gray-500">
                          +{dayReports.length - 1}
                        </div>
                      )}
                    </div>
                  )}
                  {dayReports.length === 0 && isSameMonth(day, monthStart) && (
                    <div className="text-xs text-gray-400 italic">
                      <div className="hidden md:inline">No Reports</div>
                      <div
                        className={cn(
                          "size-2 aspect-square block rounded-full md:hidden"
                        )}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <ReportDetails
        handleCloseReportSheet={setIsReportSheetOpen}
        isReportSheetOpen={isReportSheetOpen}
        selectedDate={selectedDate}
        selectedDateReports={selectedDateReports}
      />
    </>
  );
};
