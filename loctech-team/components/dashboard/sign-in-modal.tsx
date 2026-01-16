"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function SignInModal() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [name, setName] = useState("");
  const [qrSecret, setQrSecret] = useState("");
  const [qrSession, setQrSession] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const signInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, qrSecret, qrSession }),
      });
      console.log({ name, qrSecret, qrSession });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      return data as { ok: boolean };
    },
    onSuccess: () => {
      toast.success("Attendance recorded");
      setName("");
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (!videoRef.current) return;
    const qrScanner = new QrScanner(
      videoRef.current,
      (res) => {
        // Expect payload like: { secret: <daily-secret>, session: <random> }
        try {
          const parsed = JSON.parse(res.data);
          setQrSecret(parsed.secret ?? "");
          setQrSession(parsed.session ?? "");
          setHint("QR scanned. Ready to submit.");
          toast.success("QR captured");
          signInMutation.mutate();
        } catch {
          setQrSecret(res.data);
          setHint("QR scanned. Ready to submit.");
          toast.success("QR captured");
        }
      },
      { highlightScanRegion: true }
    );
    scannerRef.current = qrScanner;
    qrScanner.start().catch(() => {
      toast.error("Camera access denied or unavailable");
    });
    return () => {
      qrScanner.stop();
      qrScanner.destroy();
    };
    // eslint-disable-next-line
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-fit">Sign In for Today</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Attendance</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <label className="block text-sm">Scan office QR</label>
          <video ref={videoRef} className="w-full rounded-md border" />
          {qrSecret ? (
            <p className="text-xs text-emerald-600">QR captured.</p>
          ) : (
            <p className="text-xs text-muted-foreground">Waiting for QR...</p>
          )}
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
