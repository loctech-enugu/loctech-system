"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clipboard, Key, QrCode } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useMemo, useEffect } from "react";
import { useParams } from "next/navigation";

type ClassSession = {
  id: string;
  classId: string;
  className: string;
  date: string;
  pin: string;
  barcode: string;
  expiresAt: string;
};

async function fetchClassSession(classId: string): Promise<ClassSession> {
  const res = await fetch(`/api/attendance/classes/${classId}/session`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to fetch class session");
  return data.data;
}

export default function ClassAttendanceCodesPage() {
  const params = useParams();
  const classId = params.id as string;

  const {
    data: session,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["class-session", classId],
    queryFn: () => fetchClassSession(classId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Auto-refresh if the session date isn't today
  useEffect(() => {
    if (!session?.date) return;

    const sessionDate = new Date(session.date).toDateString();
    const today = new Date().toDateString();
    if (sessionDate !== today) {
      refetch();
    }
  }, [session, refetch]);

  const qrImg = useMemo(() => {
    if (!session) return "";
    const payloadString = JSON.stringify({
      classId: session.classId,
      barcode: session.barcode,
      date: session.date,
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      payloadString
    )}`;
  }, [session]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading attendance codes...</p>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <p className="text-red-500 font-medium">
          Failed to load attendance codes
        </p>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="font-sans max-w-4xl mx-auto p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          Attendance Codes for {session.className}
        </h1>
        <p className="text-sm text-muted-foreground">
          {`Display these codes for students to sign in. Codes are valid for ${format(new Date(session.date), "PPP")} and expire at ${format(new Date(session.expiresAt), "p")}.`}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* PIN Card */}
        <Card className="p-4 border">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Key className="h-5 w-5" />
              Attendance PIN
            </CardTitle>
            <CardDescription>
              Students can enter this PIN to sign in
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-full bg-muted rounded-md p-6 text-center">
              <code className="text-4xl font-mono font-bold">
                {session.pin.slice(0, 3)}-{session.pin.slice(3, 6)}
              </code>
            </div>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(session.pin, "PIN")}
              className="w-full"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy PIN
            </Button>
          </CardContent>
        </Card>

        {/* Barcode Card */}
        <Card className="p-4 border">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5" />
              Attendance Barcode
            </CardTitle>
            <CardDescription>
              Students can scan this QR code to sign in
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="rounded-lg bg-white p-2 shadow">
              <Image
                src={qrImg}
                alt="Attendance QR Code"
                width={320}
                height={320}
                className="w-64 h-64"
              />
            </div>
            <div className="w-full bg-muted rounded-md p-3 text-center">
              <code className="text-sm font-mono break-all">
                {session.barcode}
              </code>
            </div>
            <Button
              variant="outline"
              onClick={() => copyToClipboard(session.barcode, "Barcode")}
              className="w-full"
            >
              <Clipboard className="mr-2 h-4 w-4" />
              Copy Barcode
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Display this page on a screen or print it for students to see
          </p>
          <p>
            • Students can sign in using either the PIN or by scanning the QR code
          </p>
          <p>
            • These codes are valid for today only and will automatically refresh tomorrow
          </p>
          <p>
            • Only students enrolled in this class can use these codes
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        The attendance codes rotate daily. Refresh this page each morning to get new codes.
      </p>
    </div>
  );
}
