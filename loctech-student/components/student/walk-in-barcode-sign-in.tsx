"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import SignatureLoader from "@/components/loaders/signature";
import { CheckCircle2, QrCode } from "lucide-react";

export default function WalkInBarcodeSignIn() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [success, setSuccess] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [useCamera, setUseCamera] = useState(true);

  const signInMutation = useMutation({
    mutationFn: async ({ barcode: code }: { barcode: string }) => {
      const res = await fetch("/api/attendance/walk-in/barcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ barcode: code }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to sign in");
      return result;
    },
    onSuccess: () => {
      toast.success("Walk-in sign-in successful!");
      setSuccess(true);
      setBarcode("");
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : "Failed to sign in");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = barcode.trim();
    if (!code) {
      toast.error("Please scan or enter the barcode");
      return;
    }
    signInMutation.mutate({ barcode: code });
  };

  useEffect(() => {
    if (!videoRef.current || !useCamera || success) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (res) => {
        const data = res.data.trim();
        if (data.startsWith("walkin-")) {
          setBarcode(data);
          toast.success("Barcode captured");
          setTimeout(() => signInMutation.mutate({ barcode: data }), 300);
        } else {
          toast.error("Invalid walk-in barcode");
        }
      },
      { highlightScanRegion: true }
    );
    scannerRef.current = qrScanner;
    qrScanner.start().catch(() => {
      toast.error("Camera access denied or unavailable");
      setUseCamera(false);
    });
    return () => {
      qrScanner.stop();
      qrScanner.destroy();
    };
  }, [useCamera, success]);

  if (success) {
    return (
      <div className="font-sans flex items-center justify-center p-6">
        <Card className="w-full max-w-xl border-emerald-100 shadow-sm">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-500" />
            <CardTitle className="text-emerald-600 text-lg font-semibold">
              You&apos;re signed in!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              You&apos;ve successfully signed in for walk-in attendance on{" "}
              <span className="font-medium text-foreground">
                {new Date().toLocaleDateString()}
              </span>
              .
            </p>
            <Button variant="outline" onClick={() => setSuccess(false)}>
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="font-sans flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Walk-in Sign In
          </CardTitle>
          <CardDescription>
            Scan the QR code displayed at the front desk to sign in for walk-in attendance.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {signInMutation.isPending ? (
            <SignatureLoader />
          ) : (
            <>
              {useCamera && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Scan QR code</label>
                  <video ref={videoRef} className="w-full rounded-md border" />
                </div>
              )}
              <div className="space-y-2">
                <label className="block text-sm font-medium">Or enter barcode manually</label>
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    placeholder="Enter barcode (e.g. walkin-...)"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    className="font-mono"
                  />
                  <Button type="submit" disabled={!barcode.trim() || signInMutation.isPending}>
                    Sign In
                  </Button>
                </form>
              </div>
              {useCamera && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseCamera(false)}
                  className="text-muted-foreground"
                >
                  Use manual entry only
                </Button>
              )}
              {!useCamera && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseCamera(true)}
                  className="text-muted-foreground"
                >
                  Use camera to scan
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
