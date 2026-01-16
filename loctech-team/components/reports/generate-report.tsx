"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ApiResponse } from "@/types";
import { fetchData } from "@/lib/fetch-utils";
import { cn } from "@/lib/utils";
import { exportReportsAsDocx } from "@/lib/exportReportsAsDocx";

export default function ReportDialog() {
  const [open, setOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [report, setReport] = useState<any>(null);
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        toast.error("Please select both start and end dates.");
        throw new Error("Missing dates");
      }
      const res = await fetchData(
        `/reports/report?start=${startDate}&end=${endDate}`
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return res as ApiResponse<any>;
    },
    onSuccess: (response) => {
      setReport(response.data || []);
      toast.success("Report generated successfully!");
    },
    onError: () => toast.error("Failed to generate report."),
  });

  const handleGenerate = async () => {
    mutate();
  };

  const handleDownload = () => {
    exportReportsAsDocx(report, startDate, endDate);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const getStatusColor = (entry: any) => {
    if (!entry) return "text-gray-400";
    if (entry.isLate) return "text-red-500";
    if (entry.status === "on_time") return "text-green-600";
    return "text-yellow-500";
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Generate Report Summary</Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          report ? "w-full md:max-w-[80%]" : "max-w-5xl"
        )}
      >
        <DialogHeader>
          <DialogTitle>Report</DialogTitle>
          <DialogDescription>
            Generate and review user reports between selected dates.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
          <Button onClick={handleGenerate} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate"
            )}
          </Button>
        </div>

        {report && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2 mb-4">
              <Button onClick={handleDownload} variant="outline">
                {"📄 Download as Word (.docx)"}
              </Button>
            </div>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {report.data.map((user: any) => (
              <Card key={user.user.id}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {user.user.name}{" "}
                    <span className="text-sm text-gray-500">
                      ({user.user.role})
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(user.reports).map(
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    ([date, entry]: [string, any]) => (
                      <div
                        key={date}
                        className={`border-l-4 pl-3 ${
                          entry
                            ? entry.isLate
                              ? "border-red-500"
                              : entry.status === "on_time"
                                ? "border-green-500"
                                : "border-yellow-500"
                            : "border-gray-400"
                        }`}
                      >
                        <p className="font-medium">
                          {format(new Date(date), "PPP")}{" "}
                          <span className={getStatusColor(entry)}>
                            {entry?.isLate
                              ? "Late"
                              : entry?.status === "on_time"
                                ? "On Time"
                                : entry?.status || "N/A"}
                          </span>
                        </p>
                        {entry?.title && (
                          <p className="text-sm font-semibold">{entry.title}</p>
                        )}
                        {entry?.summary && (
                          <p className="text-sm text-muted-foreground">
                            {entry.summary}
                          </p>
                        )}
                        {entry?.tasksCompleted && (
                          <p className="text-sm text-muted-foreground">
                            <span className="font-semibold">
                              Tasks Completed:
                            </span>
                            {(entry.tasksCompleted as string[]).length > 0 ? (
                              <ul className="list-disc list-inside">
                                {(entry.tasksCompleted as string[]).map(
                                  (task: string, idx: number) => (
                                    <li key={idx}>{task}</li>
                                  )
                                )}
                              </ul>
                            ) : (
                              " None"
                            )}
                          </p>
                        )}
                        {entry?.blockers && (
                          <p className="text-sm text-red-500 capitalize ">
                            <span className="font-semibold">Blockers: </span>
                            {entry.blockers || "None"}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
