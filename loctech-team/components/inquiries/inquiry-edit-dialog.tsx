"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export type InquiryRow = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  courseOfInterest?: string | null;
  heardAboutUs?: string | null;
  message: string;
  customerCareId?: string | null;
  customerCare?: { id: string; name: string; email: string } | null;
  lead?: string;
  feedback?: string | null;
  followUp?: string | null;
  status: string;
  adminNote?: string | null;
  autoReplySent?: boolean;
  createdAt: string;
};

async function fetchStaff() {
  const res = await fetch("/api/inquiries/assignable-staff", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to load staff");
  const data = await res.json();
  return data.data as { id: string; name: string; email: string; role: string }[];
}

interface InquiryEditDialogProps {
  inquiry: InquiryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InquiryEditDialog({
  inquiry,
  open,
  onOpenChange,
}: InquiryEditDialogProps) {
  const queryClient = useQueryClient();
  const { data: staff = [] } = useQuery({
    queryKey: ["inquiry-assignable-staff"],
    queryFn: fetchStaff,
    enabled: open,
  });

  const [customerCareId, setCustomerCareId] = React.useState<string>("");
  const [lead, setLead] = React.useState<string>("warm");
  const [feedback, setFeedback] = React.useState("");
  const [followUp, setFollowUp] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("pending");
  const [adminNote, setAdminNote] = React.useState("");

  React.useEffect(() => {
    if (inquiry) {
      setCustomerCareId(inquiry.customerCareId || "");
      setLead(inquiry.lead || "warm");
      setFeedback(inquiry.feedback || "");
      setFollowUp(inquiry.followUp || "");
      setStatus(inquiry.status || "pending");
      setAdminNote(inquiry.adminNote || "");
    }
  }, [inquiry]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!inquiry) return;
      const res = await fetch(`/api/inquiries/${inquiry.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerCareId: customerCareId || null,
          lead,
          feedback: feedback.trim() || undefined,
          followUp: followUp === "" ? null : followUp,
          status,
          adminNote: adminNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      return data;
    },
    onSuccess: () => {
      toast.success("Inquiry saved");
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      onOpenChange(false);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    },
  });

  if (!inquiry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit inquiry — {inquiry.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/40 p-3 space-y-1">
            <p>
              <span className="text-muted-foreground">Email:</span> {inquiry.email}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span>{" "}
              {inquiry.phone || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Course:</span>{" "}
              {inquiry.courseOfInterest || "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Heard about us:</span>{" "}
              {inquiry.heardAboutUs || "—"}
            </p>
            <p className="pt-2">
              <span className="text-muted-foreground">Message:</span>
            </p>
            <p className="whitespace-pre-wrap text-foreground">{inquiry.message}</p>
          </div>

          <div className="space-y-2">
            <Label>Customer care (staff)</Label>
            <Select value={customerCareId || "__none__"} onValueChange={(v) => setCustomerCareId(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Assign staff" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None</SelectItem>
                {staff.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Lead</Label>
              <Select value={lead} onValueChange={setLead}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="registered">Registered</SelectItem>
                  <SelectItem value="not_interested">Not interested</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Follow-up</Label>
            <Select value={followUp || "__none__"} onValueChange={(v) => setFollowUp(v === "__none__" ? "" : v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select follow-up" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Not set</SelectItem>
                <SelectItem value="called">Called</SelectItem>
                <SelectItem value="text_whatsapp">Text / WhatsApp</SelectItem>
                <SelectItem value="call_back">Call back</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Feedback (internal)</Label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              placeholder="Notes on conversation, objections, next steps..."
            />
          </div>

          <div className="space-y-2">
            <Label>Admin note</Label>
            <Textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={3}
              placeholder="Internal note visible to team only"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
