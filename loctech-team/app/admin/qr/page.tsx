"use client";

import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useMemo } from "react";
import QrRefresher from "@/components/qr/refresher";
import { format } from "date-fns";

type TodaySession = {
  id: string;
  date: string;
  secret: string;
  session: string;
  code: string;
};

async function fetchTodaySession(): Promise<TodaySession> {
  const res = await fetch("/api/admin/qr");
  const data = await res.json();
  if (!res.ok) throw new Error("Failed to fetch today's session");
  return data.data;
}

export default function AdminQrPage() {
  const {
    data: todaySession,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["today-session"],
    queryFn: fetchTodaySession,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  console.log(todaySession);

  // Auto-refresh if the session date isn’t today
  useEffect(() => {
    if (!todaySession?.date) return;

    const sessionDate = new Date(todaySession.date).toDateString();
    const today = new Date().toDateString();
    if (sessionDate !== today) {
      refetch();
    }
  }, [todaySession, refetch]);

  const qrImg = useMemo(() => {
    if (!todaySession) return "";
    const payloadString = JSON.stringify({
      secret: todaySession.secret,
      session: todaySession.session,
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
      payloadString
    )}`;
  }, [todaySession]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading QR session...</p>
      </div>
    );
  }

  if (error || !todaySession) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-3">
        <p className="text-red-500 font-medium">
          Failed to load today’s session
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-primary text-white rounded-md hover:opacity-90 transition"
        >
          Retry
        </button>
      </div>
    );
  }

  const { code, date } = todaySession;

  return (
    <div className="font-sans max-w-xl mx-auto p-6 space-y-6">
      <QrRefresher date={date} />

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">
          Office QR Code for {format(todaySession.date, "PPP")}
        </h1>
        <p className="text-sm text-muted-foreground">
          {`Print or display this QR code in the office. It encodes today's
          rotating secret and session.`}
        </p>
      </div>

      <Card className="p-4 border">
        <CardHeader className="text-center">
          <CardTitle>Scan or Copy the Code</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <div className="rounded-lg bg-white p-2 shadow">
            <Image
              src={qrImg}
              alt="Attendance QR"
              width={320}
              height={320}
              className="w-80 h-80"
            />
          </div>

          <div className="w-full bg-muted rounded-md p-3 text-center">
            <code className="text-2xl font-mono">{`${code.slice(0, 3)}-${code.slice(3, 6)}`}</code>
          </div>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground text-center">
        The QR secret rotates daily. Refresh this page each morning to get a new
        QR.
      </p>
    </div>
  );
}
