// ReportDetails.tsx
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
import type { DailyReport as Report } from "@/types";
import { useDeleteReport } from "@/hooks/use-calendar";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ViewReport } from "./view";
import { useDisclosure } from "@/hooks/use-disclosure";
import { ScrollArea } from "../ui/scroll-area";
// import { EditReportDialog } from "./EditReportDialog";

interface Props {
  isReportSheetOpen: boolean;
  handleCloseReportSheet: (open: boolean) => void;
  selectedDate: Date | null;
  selectedDateReports: Report[];
}

const getStatusColor = (status: Report["status"]) => {
  const colors = {
    draft: "bg-gray-100 text-gray-800",
    submitted: "bg-blue-100 text-blue-800",
    approved: "bg-green-100 text-green-800",
    rejected: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
};

export const ReportDetails = ({
  isReportSheetOpen,
  handleCloseReportSheet,
  selectedDate,
  selectedDateReports,
}: Props) => {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isPending } = useDeleteReport();

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    onOpen();
  };

  //   const handleDeleteReport = (id: string) => {
  //     mutate(id, {});
  //   };
  console.log(selectedDateReports);

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
                ? "View and manage reports for this date"
                : "Click on a date to view reports"}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="h-4/5 w-full p-4">
            <div className="space-y-4">
              {selectedDate ? (
                selectedDateReports.length === 0 ? (
                  <p className="text-gray-500 text-sm p-6">No Report Today</p>
                ) : (
                  selectedDateReports.map((report) => (
                    <div
                      key={report.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{report.title}</h4>
                          {report.summary && (
                            <p className="text-sm text-gray-600 mt-1">
                              {report.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewReport(report)}
                            disabled={isPending}
                            title="View"
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{format(new Date(report.createdAt), "p")}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {report.isLate ? (
                            <UserX className="w-3 h-3 text-red-500" />
                          ) : (
                            <UserCheck className="w-3 h-3 text-green-500" />
                          )}
                          <span>{report.user.name}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          className={cn(
                            getStatusColor(report.status),
                            "capitalize"
                          )}
                        >
                          {report.status}
                        </Badge>
                        {report.reviewedBy && (
                          <span className="text-xs text-gray-500">
                            Reviewed by {report.reviewedBy}
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

      {selectedReport && (
        <ViewReport
          report={selectedReport}
          open={isOpen}
          onOpenChange={onOpenChange}
        />
      )}
    </>
  );
};
