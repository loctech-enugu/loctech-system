"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { Student } from ".";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Mail, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface BatchNotifyDialogProps {
  students: Student[];
  delayMs?: number; // delay between emails (default 800ms)
}

export default function BatchNotifyDialog({
  students,
  delayMs = 30000,
}: BatchNotifyDialogProps) {
  const [open, setOpen] = useState(false);

  // lastIndex = how many have been processed (0 = none processed)
  const [lastIndex, setLastIndex] = useState<number>(0);
  const [isSending, setIsSending] = useState(false); // overall run/paused
  const [isLoading, setIsLoading] = useState(false); // single-request-in-flight guard
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  const total = students.length;

  // Derived progress percent
  const progress =
    total === 0 ? 0 : Number(((lastIndex / total) * 100).toFixed(2));

  // Send single email (uses controllerRef.signal to allow abort)
  const sendOne = useCallback(async (student: Student): Promise<boolean> => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/students/${student.id}/notify`, {
        method: "POST",
        signal: controllerRef.current?.signal,
      });
      if (!res.ok) {
        const text = await res.text().catch(() => res.statusText || "Error");
        console.error("Notify failed:", student.email, res.status, text);
        return false;
      }
      toast.success(`Email sent to ${student.name}`);
      return true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err?.name === "AbortError") {
        console.warn("Send aborted for", student.email);
      } else {
        console.error("Notify error:", student.email, err);
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Recursive/iterative sender — sends one, advances lastIndex, persists, schedules next
  const sendNext = useCallback(async () => {
    // safety guards
    if (!isSending) return;
    if (isLoading) return; // don't start another while a request is in-flight
    if (lastIndex >= total) {
      setIsSending(false);
      setCompleted(true);
      return;
    }

    const student = students[lastIndex];
    // if no student at index (defensive)
    if (!student) {
      setLastIndex((prev) => {
        const next = prev + 1;
        localStorage.setItem("lastIndex", String(next));
        return next;
      });
      // schedule next
      if (lastIndex + 1 < total) setTimeout(() => sendNext(), delayMs);
      else {
        setIsSending(false);
        setCompleted(true);
      }
      return;
    }

    const ok = await sendOne(student);
    if (!ok) return;
    // advance index regardless of ok/fail (you can change to retry logic if needed)
    setLastIndex((prev) => {
      const next = prev + 1;
      localStorage.setItem("lastIndex", String(next));
      return next;
    });

    // if aborted while waiting or after sendOne
    if (controllerRef.current?.signal.aborted) {
      setIsSending(false);
      return;
    }

    // schedule next if still sending and not complete
    if (lastIndex + 1 < total && isSending) {
      setTimeout(() => {
        // check again before firing to avoid duplicate calls when paused
        if (isSending && !controllerRef.current?.signal.aborted) sendNext();
      }, delayMs);
    } else {
      setIsSending(false);
      setCompleted(true);
    }
    // note: errors are logged in sendOne; you can setError(...) there if you want
  }, [isSending, isLoading, lastIndex, total, students, delayMs, sendOne]);

  // start/resume sending
  const handleStart = () => {
    if (total === 0) return;
    // if already completed, nothing to do
    if (lastIndex >= total) {
      setCompleted(true);
      return;
    }
    controllerRef.current = new AbortController();
    setError(null);
    setCompleted(false);
    setIsSending(true);
  };

  // stop / pause sending
  const handleStop = () => {
    controllerRef.current?.abort();
    setIsSending(false);
  };

  // reset progress
  const handleReset = () => {
    controllerRef.current?.abort();
    setIsSending(false);
    setIsLoading(false);
    setCompleted(false);
    setError(null);
    setLastIndex(0);
    localStorage.removeItem("lastIndex");
  };

  // restore lastIndex from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("lastIndex");
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) {
        setLastIndex(parsed);
        if (parsed >= total && total > 0) setCompleted(true);
      }
    }
  }, [total]);

  // when isSending becomes true, kick off sendNext (if not already sending)
  useEffect(() => {
    if (isSending && !isLoading) {
      // small tick to avoid re-entrancy issues
      setTimeout(() => {
        sendNext();
      }, delayMs);
    }
  }, [isSending, isLoading, sendNext, delayMs]);

  // display counts using lastIndex
  const countLabel = `${Math.min(lastIndex, total)} / ${total}`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="flex items-center gap-2">
          <Mail className="w-4 h-4" />
          Send Batch Emails
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Send Notifications</DialogTitle>
          <DialogDescription>
            This will send notification emails to {total} students. The backend
            builds the actual message; this client just tells the backend which
            user to notify (one-by-one). You can pause and resume.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="mt-4 space-y-4">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>
              {countLabel} ({progress}%)
            </span>
          </div>

          <Progress value={progress} className="h-3" />

          {lastIndex > 0 && lastIndex < total && (
            <p className="text-xs text-muted-foreground">
              Last sent index: <span className="font-mono">{lastIndex}</span>
            </p>
          )}

          {completed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>All emails sent successfully!</span>
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 flex justify-end gap-3">
          <Button
            variant="secondary"
            onClick={handleReset}
            disabled={isSending || isLoading}
          >
            Reset Progress
          </Button>

          {!isSending ? (
            <Button
              onClick={handleStart}
              disabled={total === 0 || lastIndex >= total || isLoading}
            >
              {lastIndex > 0 && lastIndex < total
                ? "Resume Sending"
                : "Start Sending"}
            </Button>
          ) : (
            <Button
              variant="destructive"
              onClick={handleStop}
              disabled={isLoading}
            >
              {isLoading ? "Stopping..." : "Stop"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
