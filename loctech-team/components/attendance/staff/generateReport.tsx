"use client";

import { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Loader2, FileDown } from "lucide-react";
import { toast } from "sonner";
import { fetchData } from "@/lib/fetch-utils";
import { ApiResponse } from "@/types";
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import { Label } from "@/components/ui/label";
// import html2pdf from "html2pdf.js";
// interface Html2PdfOptions {
//   margin?: number | [number, number] | [number, number, number, number];
//   filename?: string;
//   image?: {
//     type?: "jpeg" | "png" | "webp";
//     quality?: number;
//   };
//   enableLinks?: boolean;
//   html2canvas?: object;
//   jsPDF?: {
//     unit?: string;
//     format?: string | [number, number];
//     orientation?: "portrait" | "landscape";
//   };
// }
interface Attendance {
  id?: string;
  time?: string;
  isLate?: boolean;
  session?: { dateKey: string };
  isExcused?: boolean;
}

interface UserReport {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    title?: string;
  };
  attendance: Record<string, Attendance | null>;
}

const GenerateAttendanceReport = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [data, setData] = useState<UserReport[] | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      if (!startDate || !endDate) {
        toast.error("Please select both start and end dates.");
        throw new Error("Missing dates");
      }
      const res = await fetchData(
        `/attendance/staff/report?start=${startDate}&end=${endDate}`
      );
      return res as ApiResponse<UserReport[]>;
    },
    onSuccess: (response) => {
      setData(response.data || []);
      toast.success("Report generated successfully!");
    },
    onError: () => toast.error("Failed to generate report."),
  });

  // 🧮 Color coding based on time
  const getTimeColor = (time?: string) => {
    if (!time) return "text-gray-400";
    const date = new Date(time);
    const hour = date.getHours();
    const minute = date.getMinutes();
    if (hour < 8) return "text-green-600";
    if (hour === 8 && minute <= 10) return "text-yellow-500";
    return "text-red-600";
  };

  // 📤 Download CSV (structured like the table)
  const handleDownloadCSV = () => {
    if (!data || data.length === 0) return;
    const allDates = Object.keys(data[0].attendance);
    let csv = ["Name,Email," + allDates.join(",") + "\n"].join("");

    data.forEach((report) => {
      const row = [
        report.user.name,
        report.user.email,
        ...allDates.map((date) => {
          const att = report.attendance[date];
          if (!att) return "Absent";
          const t =
            att.time &&
            new Date(att.time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          return t;
        }),
      ];
      csv += row.join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `attendance_report_${startDate}_${endDate}.csv`);
  };

  // 📄 Download PDF using html2pdf.js
  //   const handleDownloadPDF = async () => {
  //     if (!tableRef.current) return;
  //     const element = tableRef.current;

  //     // 🧩 Temporarily disable unsupported CSS color functions
  //     const originalBg = element.style.backgroundColor;
  //     element.style.backgroundColor = "#ffffff"; // solid white background

  //     const opt: Html2PdfOptions = {
  //       margin: 0.5,
  //       filename: `attendance_report_${startDate}_${endDate}.pdf`,
  //       image: { type: "jpeg", quality: 0.98 },
  //       html2canvas: {
  //         scale: 2,
  //         useCORS: true,
  //         backgroundColor: "#ffffff", // Force fallback color
  //         onclone: (clonedDoc: any) => {
  //           // remove potential Tailwind color-mix() or lab() references
  //           clonedDoc.querySelectorAll("*").forEach((el: any) => {
  //             const computed = getComputedStyle(el);
  //             if (computed.backgroundColor.includes("lab(")) {
  //               (el as HTMLElement).style.backgroundColor = "#ffffff";
  //             }
  //             if (computed.color.includes("lab(")) {
  //               (el as HTMLElement).style.color = "#000000";
  //             }
  //           });
  //         },
  //       },
  //       jsPDF: { unit: "in", format: "a4", orientation: "landscape" },
  //     };

  //     try {
  //       await html2pdf().set(opt).from(element).save();
  //     } catch (err) {
  //       console.error("PDF generation failed:", err);
  //       toast.error("Failed to generate PDF. Try CSV instead.");
  //     } finally {
  //       element.style.backgroundColor = originalBg;
  //     }
  //   };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Generate Attendance Report</Button>
      </DialogTrigger>
      <DialogContent
        className={cn(
          "max-h-[85vh] overflow-y-auto",
          data ? "w-full md:max-w-[80%]" : "max-w-5xl"
        )}
      >
        <DialogHeader>
          <DialogTitle>Generate Attendance Report</DialogTitle>
        </DialogHeader>

        {/* Date Pickers */}
        <div className="flex gap-3 items-end mb-4">
          <div className="flex flex-col">
            <Label className="text-sm font-medium mb-1">Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col">
            <Label className="text-sm font-medium mb-1">End Date</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button
            disabled={!startDate || !endDate || isPending}
            onClick={() => mutate()}
            className="ml-2"
          >
            {isPending ? <Loader2 className="animate-spin" /> : "Generate"}
          </Button>
        </div>

        {/* Download Buttons */}
        {data && data.length > 0 && (
          <div className="flex justify-end gap-2 mb-3">
            <Button variant="outline" onClick={handleDownloadCSV}>
              <FileDown className="w-4 h-4 mr-2" /> CSV
            </Button>
            {/* <Button variant="outline" onClick={handleDownloadPDF}>
              <FileText className="w-4 h-4 mr-2" /> PDF
            </Button> */}
          </div>
        )}

        {/* Loading */}
        {isPending && (
          <p className="text-center py-6 text-sm text-muted-foreground">
            Loading report...
          </p>
        )}

        {/* Table */}
        {!isPending && data && data.length > 0 && (
          <div ref={tableRef} className="border rounded-lg overflow-x-auto p-4">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  {Object.keys(data[0].attendance).map((date) => (
                    <th key={date} className="p-2 border">
                      {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((report) => (
                  <tr key={report.user.id}>
                    <td className="p-2 border">{report.user.name}</td>
                    <td className="p-2 border">{report.user.email}</td>
                    {Object.entries(report.attendance).map(([date, att]) => (
                      <td
                        key={date}
                        className={cn(
                          "p-2 border text-center font-medium",
                          getTimeColor(att?.time)
                        )}
                      >
                        {att
                          ? new Date(att.time!).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty state */}
        {!isPending && data?.length === 0 && (
          <p className="text-center py-6 text-sm text-muted-foreground">
            No report found for selected dates.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default GenerateAttendanceReport;
