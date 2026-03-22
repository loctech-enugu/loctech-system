"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Download, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";

async function fetchClasses() {
  const res = await fetch("/api/classes", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch classes");
  const data = await res.json();
  return data.data ?? [];
}

function downloadCsv(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportReports() {
  const [classId, setClassId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const { data: classes = [] } = useQuery({
    queryKey: ["classes"],
    queryFn: fetchClasses,
  });

  const handleExport = async (type: "attendance" | "roster" | "grades") => {
    if (!classId) {
      toast.error("Please select a class");
      return;
    }
    try {
      let url = "";
      if (type === "attendance") {
        const params = new URLSearchParams({ classId });
        if (startDate) params.set("startDate", startDate);
        if (endDate) params.set("endDate", endDate);
        url = `/api/reports/attendance?${params}`;
      } else if (type === "roster") {
        url = `/api/reports/roster?classId=${classId}`;
      } else {
        url = `/api/reports/grades?classId=${classId}`;
      }
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Export failed");
      const text = await res.text();
      const filename =
        type === "attendance"
          ? `attendance-${classId}.csv`
          : type === "roster"
            ? `roster-${classId}.csv`
            : `grades-${classId}.csv`;
      downloadCsv(text, filename);
      toast.success(`Downloaded ${filename}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export failed");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Export Reports
        </CardTitle>
        <CardDescription>
          Download attendance, course roster, or grade summary as CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((c: { id: string; name: string }) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="date"
            placeholder="Start date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-40"
          />
          <Input
            type="date"
            placeholder="End date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-40"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("attendance")}
            disabled={!classId}
          >
            <Download className="h-4 w-4 mr-1" />
            Attendance CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("roster")}
            disabled={!classId}
          >
            <Download className="h-4 w-4 mr-1" />
            Roster CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport("grades")}
            disabled={!classId}
          >
            <Download className="h-4 w-4 mr-1" />
            Grades CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
