"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SpinnerLoader } from "@/components/spinner";
import { Check } from "lucide-react";
import { useState } from "react";

async function fetchInquiries(status?: string) {
  const url = status ? `/api/inquiries?status=${status}` : "/api/inquiries";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch inquiries");
  const data = await res.json();
  return data.data ?? [];
}

export default function InquiriesTable() {
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ["inquiries", statusFilter],
    queryFn: () => fetchInquiries(statusFilter || undefined),
  });

  const markResponded = async (id: string) => {
    const res = await fetch(`/api/inquiries/${id}/respond`, {
      method: "PATCH",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to update");
    window.location.reload();
  };

  if (isLoading) {
    return (
      <SpinnerLoader
        title="Loading"
        message="Fetching inquiries..."
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex rounded-md border">
          {["", "new", "contacted", "converted", "closed"].map((s) => (
            <button
              key={s || "all"}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 text-sm ${statusFilter === s ? "bg-muted font-medium" : ""}`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No inquiries found
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry: {
                id: string;
                name: string;
                email: string;
                phone?: string;
                courseOfInterest?: string;
                message: string;
                status: string;
                autoReplySent: boolean;
                createdAt: string;
              }) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="font-medium">{inquiry.name}</TableCell>
                  <TableCell>{inquiry.email}</TableCell>
                  <TableCell>{inquiry.phone || "-"}</TableCell>
                  <TableCell>{inquiry.courseOfInterest || "-"}</TableCell>
                  <TableCell>
                    <Badge variant={inquiry.status === "new" ? "default" : "secondary"}>
                      {inquiry.status}
                    </Badge>
                    {inquiry.autoReplySent && (
                      <span className="ml-1 text-xs text-muted-foreground">(auto-replied)</span>
                    )}
                  </TableCell>
                  <TableCell>{new Date(inquiry.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {inquiry.status === "new" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => markResponded(inquiry.id)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark responded
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
