"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export default function SignInForm() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [name, setName] = useState("");
  const [qrSecret, setQrSecret] = useState("");
  const [qrSession, setQrSession] = useState("");
  const [hint, setHint] = useState<string | null>(null);

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
  }, []);

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

  async function submitAttendance(e: React.FormEvent) {
    e.preventDefault();
    signInMutation.mutate();
  }

  return (
    <div className="font-sans min-h-dvh flex items-center justify-center p-6">
      <Toaster richColors position="top-center" />
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={submitAttendance} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-sm">Your name</label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm">Scan office QR</label>
              <video ref={videoRef} className="w-full rounded-md border" />
              {qrSecret ? (
                <p className="text-xs text-emerald-600">QR captured.</p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Waiting for QR...
                </p>
              )}
              {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
            </div>
            <Button
              type="submit"
              disabled={signInMutation.isPending || !name || !qrSecret}
            >
              {signInMutation.isPending ? "Submitting..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
