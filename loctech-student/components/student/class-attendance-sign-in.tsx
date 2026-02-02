"use client";

import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import SignatureLoader from "@/components/loaders/signature";
import { CheckCircle2 } from "lucide-react";
import { SignInWithCode } from "./sign-in-otp";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

async function fetchEnrollment(enrollmentId: string) {
  const res = await fetch(`/api/enrollments/${enrollmentId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch enrollment");
  const data = await res.json();
  return data.data;
}

async function recordAttendance(data: {
  studentId: string;
  classId: string;
  date: string;
  status: "present";
  method: "pin" | "barcode";
  pin?: string;
  barcode?: string;
}) {
  const res = await fetch("/api/attendance/classes/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const result = await res.json();
    throw new Error(result.error || "Failed to record attendance");
  }
  return res.json();
}

interface ClassAttendanceSignInProps {
  enrollmentId: string;
}

export default function ClassAttendanceSignIn({
  enrollmentId,
}: ClassAttendanceSignInProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const [success, setSuccess] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [hint, setHint] = useState<string | null>(null);

  const { data: enrollment, isLoading: loadingEnrollment } = useQuery({
    queryKey: ["enrollment", enrollmentId],
    queryFn: () => fetchEnrollment(enrollmentId),
    enabled: !!enrollmentId,
  });

  const recordAttendanceMutation = useMutation({
    mutationFn: recordAttendance,
    onSuccess: () => {
      toast.success("Attendance recorded successfully!");
      setSuccess(true);
      setBarcode("");
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
      router.refresh();
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record attendance");
    },
  });

  // QR Scanner setup
  useEffect(() => {
    if (!videoRef.current || !enrollment || success) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (res) => {
        try {
          // Try to parse as JSON first (for structured barcode)
          const parsed = JSON.parse(res.data);
          if (parsed.barcode) {
            // Validate it's for the correct class if classId is present
            if (parsed.classId && parsed.classId !== enrollment.classId) {
              toast.error("This QR code is for a different class");
              return;
            }
            setBarcode(parsed.barcode);
            setHint("QR scanned. Ready to submit.");
            toast.success("QR captured");
            // Auto-submit after a short delay
            setTimeout(() => {
              handleBarcodeSubmit(parsed.barcode);
            }, 500);
          } else if (parsed.classId && parsed.barcode) {
            // Validate it's for the correct class
            if (parsed.classId === enrollment.classId) {
              setBarcode(parsed.barcode);
              setHint("QR scanned. Ready to submit.");
              toast.success("QR captured");
              setTimeout(() => {
                handleBarcodeSubmit(parsed.barcode);
              }, 500);
            } else {
              toast.error("This QR code is for a different class");
            }
          }
        } catch {
          // If not JSON, treat as plain barcode string
          // Barcode format: classId-dateKey-token
          const barcodeParts = res.data.split("-");
          if (barcodeParts.length >= 3) {
            const scannedClassId = barcodeParts[0];
            if (scannedClassId !== enrollment.classId) {
              toast.error("This QR code is for a different class");
              return;
            }
          }
          setBarcode(res.data);
          setHint("QR scanned. Ready to submit.");
          toast.success("QR captured");
          setTimeout(() => {
            handleBarcodeSubmit(res.data);
          }, 500);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrollment, success]);

  const handleBarcodeSubmit = (barcodeValue?: string) => {
    if (!enrollment || !session || recordAttendanceMutation.isPending) return;

    const barcodeToUse = barcodeValue || barcode;
    if (!barcodeToUse) {
      toast.error("Please scan a QR code or enter a barcode");
      return;
    }

    recordAttendanceMutation.mutate({
      studentId: session.user.id,
      classId: enrollment.classId,
      date: new Date().toISOString().split("T")[0],
      status: "present",
      method: "barcode",
      barcode: barcodeToUse.trim(),
    });
  };

  const handleCodeSubmit = (code: string) => {
    if (!enrollment || !session) return;

    recordAttendanceMutation.mutate({
      studentId: session.user.id,
      classId: enrollment.classId,
      date: new Date().toISOString().split("T")[0],
      status: "present",
      method: "pin",
      pin: code.trim(),
    });
  };

  if (loadingEnrollment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading class information...</p>
      </div>
    );
  }

  if (!enrollment) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Enrollment not found</p>
      </div>
    );
  }

  return (
    <div className="font-sans flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Attendance - {enrollment.class?.name || "Class"}</CardTitle>
          <CardAction>
            <SignInWithCode onCodeSubmit={handleCodeSubmit} />
          </CardAction>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="flex flex-col items-center justify-center space-y-3 py-6">
              <CheckCircle2 className="w-14 h-14 text-emerald-500" />
              <p className="text-lg font-semibold text-emerald-600">
                You've successfully signed in!
              </p>
              <p className="text-sm text-muted-foreground">
                Great job! 🎉 You've successfully signed in for{" "}
                <span className="font-medium text-foreground">
                  {new Date().toLocaleDateString()}
                </span>
                .
              </p>
              <Button variant="outline" onClick={() => setSuccess(false)}>
                Sign In Again
              </Button>
            </div>
          ) : recordAttendanceMutation.isPending ? (
            <SignatureLoader />
          ) : (
            <div className="space-y-1.5">
              <div className="space-y-1.5">
                <label className="block text-sm">Scan class QR code</label>
                <video ref={videoRef} className="w-full rounded-md border" />
                {barcode ? (
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
        </CardContent>
      </Card>
    </div>
  );
}
