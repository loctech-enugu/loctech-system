"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { InquiryRow } from "./inquiry-edit-dialog";

interface InquiryConvertDialogProps {
  inquiry: InquiryRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function InquiryConvertDialog({
  inquiry,
  open,
  onOpenChange,
}: InquiryConvertDialogProps) {
  const queryClient = useQueryClient();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [address, setAddress] = React.useState("");

  React.useEffect(() => {
    if (inquiry) {
      setName(inquiry.name ?? "");
      setEmail(inquiry.email ?? "");
      setPhone(inquiry.phone ?? "");
      setAddress("");
    }
  }, [inquiry]);

  const convertMutation = useMutation({
    mutationFn: async () => {
      if (!inquiry) return;
      const res = await fetch(`/api/inquiries/${inquiry.id}/convert-to-student`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Conversion failed");
      return data;
    },
    onSuccess: () => {
      toast.success("Student account created and inquiry marked as converted");
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      queryClient.invalidateQueries({ queryKey: ["students"] });
      onOpenChange(false);
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Conversion failed");
    },
  });

  if (!inquiry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Convert to student — {inquiry.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Creates an onboarding account (no assessment). Remaining profile fields can be completed
          later in the student record. Course interest from the inquiry:{" "}
          <span className="font-medium text-foreground">
            {inquiry.courseOfInterest || "—"}
          </span>
        </p>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label htmlFor="cv-name">Full name</Label>
            <Input
              id="cv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cv-email">Email</Label>
            <Input
              id="cv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cv-phone">Phone</Label>
            <Input
              id="cv-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cv-address">Address (optional)</Label>
            <Input
              id="cv-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Defaults to a placeholder if left empty"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => convertMutation.mutate()}
            disabled={convertMutation.isPending || !name.trim() || !email.trim()}
          >
            {convertMutation.isPending ? "Creating…" : "Create student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
