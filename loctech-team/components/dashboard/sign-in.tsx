"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useMutation } from "@tanstack/react-query";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SignatureLoader from "../loaders/signature";
import { CheckCircle2 } from "lucide-react";
import { SignInWithCode } from "./sign-in-otp";
import { useRouter } from "next/navigation";

export default function SignInForm() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [success, setSuccess] = useState(false);
  const [qrSecret, setQrSecret] = useState("");
  const [qrSession, setQrSession] = useState("");
  const [hint, setHint] = useState<string | null>(null);
  const router = useRouter();

  const signInMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/sign-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrSecret, qrSession }),
      });
      console.log({ qrSecret, qrSession });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      return data as { ok: boolean };
    },
    onSuccess: () => {
      toast.success("Attendance recorded");
      setSuccess(true);
      router.refresh();
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

  useEffect(() => {
    if (!success)
      if (qrSecret && qrSession && !signInMutation.isPending) {
        signInMutation.mutate();
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrSecret, qrSession, success]);

  return (
    <div className="font-sans flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardAction>
            <SignInWithCode />
          </CardAction>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <CheckCircle2 className="w-14 h-14 text-emerald-500" />
              <p className="text-lg font-semibold text-emerald-600">
                You’ve successfully signed in!
              </p>
              <Button variant="outline" onClick={() => setSuccess(false)}>
                Done
              </Button>
            </div>
          ) : signInMutation.isPending ? (
            <SignatureLoader />
          ) : (
            <div className="space-y-1.5">
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
                {hint && (
                  <p className="text-xs text-muted-foreground">{hint}</p>
                )}
              </div>
            </div>
          )}
          {/* <Button onClick={() => signInMutation.mutate()}>Submit</Button> */}
        </CardContent>
      </Card>
    </div>
  );
}
