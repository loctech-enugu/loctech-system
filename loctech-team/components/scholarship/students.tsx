"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { Student } from ".";
import { useEffect, useState } from "react";

interface NotifyStudentButtonProps {
  student: Student;
}

export function NotifyStudentButton({ student }: NotifyStudentButtonProps) {
  const [hasError, setHasError] = useState(false);
  const mutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/students/${student.id}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed to send email");
      return res.json();
    },
    onSuccess: () => {
      toast.success(`Email sent to ${student.name}`);
      // store last notified student info
      localStorage.setItem("lastIndex", String(student.count));
      localStorage.setItem("lastSentAt", new Date().toISOString());
      setHasError(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to send email");
      localStorage.setItem("lastSentAt", new Date().toISOString());
      setHasError(true);
    },
  });
  console.log(new Date().toISOString());

  useEffect(() => {
    const checkAndSend = () => {
      const lastIndex = parseInt(localStorage.getItem("lastIndex") ?? "0", 10);
      const lastSentAt = localStorage.getItem("lastSentAt");

      if (!lastSentAt) {
        localStorage.setItem("lastSentAt", new Date().toISOString());
        return;
      }

      const lastSentDate = new Date(lastSentAt);
      const diffMs = Date.now() - lastSentDate.getTime();
      const diffMins = diffMs / 1000 / 60;

      if (
        diffMins >= 0.2 &&
        student.count === lastIndex + 1 &&
        !mutation.isPending
      ) {
        mutation.mutate();
      }
    };

    // Run once immediately
    checkAndSend();

    // Then run every 30 seconds
    const interval = setInterval(checkAndSend, 20 * 1000);

    return () => clearInterval(interval);
  }, [student.count, mutation, hasError]);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex items-center gap-2"
    >
      <Mail className="h-4 w-4" />
      {mutation.isPending ? "Sending..." : "Notify"}
    </Button>
  );
}
