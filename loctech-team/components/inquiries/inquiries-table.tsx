"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Check, Pencil } from "lucide-react";
import { useState } from "react";
import InquiryEditDialog, { type InquiryRow } from "./inquiry-edit-dialog";

const PAGE_SIZE = 20;

async function fetchInquiries(status: string | undefined, page: number) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  params.set("page", String(page));
  params.set("limit", String(PAGE_SIZE));
  const res = await fetch(`/api/inquiries?${params.toString()}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch inquiries");
  const data = await res.json();
  const payload = data.data as
    | {
        inquiries: InquiryRow[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }
    | undefined;
  return {
    inquiries: payload?.inquiries ?? [],
    pagination:
      payload?.pagination ?? {
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 1,
      },
  };
}

const FOLLOW_LABELS: Record<string, string> = {
  called: "Called",
  text_whatsapp: "Text / WhatsApp",
  call_back: "Call back",
};

function leadBadgeClass(lead: string) {
  if (lead === "hot") return "bg-red-100 text-red-900";
  if (lead === "cold") return "bg-slate-200 text-slate-800";
  return "bg-amber-100 text-amber-900";
}

function statusBadgeVariant(status: string) {
  if (status === "registered") return "default";
  if (status === "not_interested") return "secondary";
  return "outline";
}

export default function InquiriesTable() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<InquiryRow | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["inquiries", statusFilter, page],
    queryFn: () => fetchInquiries(statusFilter || undefined, page),
  });

  const inquiries = data?.inquiries ?? [];
  const pagination = data?.pagination;

  const markResponded = async (id: string) => {
    const res = await fetch(`/api/inquiries/${id}/respond`, {
      method: "PATCH",
      credentials: "include",
    });
    if (!res.ok) throw new Error("Failed to update");
    queryClient.invalidateQueries({ queryKey: ["inquiries"] });
  };

  if (isLoading) {
    return (
      <SpinnerLoader title="Loading" message="Fetching inquiries..." />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <div className="flex flex-wrap rounded-md border">
          {["", "pending", "registered", "not_interested"].map((s) => (
            <button
              key={s || "all"}
              type="button"
              onClick={() => {
                setStatusFilter(s);
                setPage(1);
              }}
              className={`px-4 py-2 text-sm capitalize ${statusFilter === s ? "bg-muted font-medium" : ""}`}
            >
              {s === "" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Date</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Heard about</TableHead>
              <TableHead>Customer care</TableHead>
              <TableHead>Lead</TableHead>
              <TableHead className="max-w-[120px]">Feedback</TableHead>
              <TableHead>Follow-up</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="max-w-[120px]">Admin note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-8 text-muted-foreground">
                  No inquiries found
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry: InquiryRow) => (
                <TableRow key={inquiry.id}>
                  <TableCell className="whitespace-nowrap text-sm">
                    {new Date(inquiry.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="font-medium">{inquiry.name}</TableCell>
                  <TableCell className="max-w-[160px] truncate text-sm">{inquiry.email}</TableCell>
                  <TableCell className="text-sm">{inquiry.phone || "—"}</TableCell>
                  <TableCell className="max-w-[120px] truncate text-sm">
                    {inquiry.courseOfInterest || "—"}
                  </TableCell>
                  <TableCell className="max-w-[100px] truncate text-sm capitalize">
                    {inquiry.heardAboutUs?.replace(/_/g, " ") || "—"}
                  </TableCell>
                  <TableCell className="text-sm max-w-[120px] truncate">
                    {inquiry.customerCare?.name || "—"}
                  </TableCell>
                  <TableCell>
                    <Badge className={leadBadgeClass(inquiry.lead || "warm")}>
                      {inquiry.lead || "warm"}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className="max-w-[120px] text-xs text-muted-foreground truncate"
                    title={inquiry.feedback ?? ""}
                  >
                    {inquiry.feedback || "—"}
                  </TableCell>
                  <TableCell className="text-sm whitespace-nowrap">
                    {inquiry.followUp
                      ? FOLLOW_LABELS[inquiry.followUp] ?? inquiry.followUp
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(inquiry.status)}>
                      {inquiry.status === "not_interested"
                        ? "Not interested"
                        : inquiry.status}
                    </Badge>
                    {inquiry.autoReplySent && (
                      <span className="ml-1 text-xs text-muted-foreground">(auto-reply)</span>
                    )}
                  </TableCell>
                  <TableCell
                    className="max-w-[120px] text-xs text-muted-foreground truncate"
                    title={inquiry.adminNote ?? ""}
                  >
                    {inquiry.adminNote || "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(inquiry)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      {inquiry.status === "pending" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markResponded(inquiry.id)}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Called
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && (
        <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <span>
            {pagination.total === 0
              ? "No results"
              : `Showing ${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                  pagination.page * pagination.limit,
                  pagination.total
                )} of ${pagination.total}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-foreground tabular-nums">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      <InquiryEditDialog
        inquiry={editing}
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(null)}
      />
    </div>
  );
}
