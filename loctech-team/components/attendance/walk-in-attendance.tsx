"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Search, UserCheck, LogOut, QrCode, RefreshCw, Users } from "lucide-react";
import { Badge } from "../ui/badge";
import type {
  WalkInSignedInRecord,
  WalkInSession,
  WalkInStudentSearchResult,
} from "@/types/walkin-attendance";
import Image from "next/image";

async function searchStudents(query: string): Promise<WalkInStudentSearchResult[]> {
  if (!query || query.length < 2) return [];
  const res = await fetch(`/api/attendance/walk-in/search?q=${encodeURIComponent(query)}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.data ?? [];
}

async function fetchSignedIn(date?: string): Promise<WalkInSignedInRecord[]> {
  const url = date ? `/api/attendance/walk-in?date=${date}` : "/api/attendance/walk-in";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.data ?? [];
}

async function fetchSession(): Promise<WalkInSession | null> {
  const res = await fetch("/api/attendance/walk-in/session", { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch session");
  const data = await res.json();
  return data.data ?? null;
}

export default function WalkInAttendance() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["walk-in-search", searchQuery],
    queryFn: () => searchStudents(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const { data: signedIn = [], isLoading: loadingSignedIn } = useQuery({
    queryKey: ["walk-in-signed-in", selectedDate],
    queryFn: () => fetchSignedIn(selectedDate),
  });

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["walk-in-session"],
    queryFn: fetchSession,
  });

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/attendance/walk-in/session", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("New session created. Previous barcodes are now invalid.");
      queryClient.invalidateQueries({ queryKey: ["walk-in-session"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed"),
  });

  const recordAttendance = async (studentId: string) => {
    try {
      const res = await fetch("/api/attendance/walk-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ studentId, date: selectedDate }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed");
      toast.success(data.message || "Signed in");
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["walk-in-signed-in"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to record");
    }
  };

  const signOutMutation = useMutation({
    mutationFn: async (recordId: string) => {
      const res = await fetch(`/api/attendance/walk-in/${recordId}/sign-out`, {
        method: "PATCH",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed");
      return data;
    },
    onSuccess: (_, recordId) => {
      toast.success("Signed out");
      queryClient.setQueryData<WalkInSignedInRecord[]>(
        ["walk-in-signed-in", selectedDate],
        (old) => (old ?? []).filter((r) => r.id !== recordId)
      );
      queryClient.invalidateQueries({ queryKey: ["walk-in-signed-in"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Failed to sign out"),
  });

  const signOut = (recordId: string) => signOutMutation.mutate(recordId);

  const qrUrl = session?.barcode
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(session.barcode)}`
    : null;

  return (
    <div className="space-y-6">
      {/* Barcode session for students */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Walk-in Barcode
              </CardTitle>
              <CardDescription>
                Students can scan this QR code to sign in. Creating a new session invalidates the previous one.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => createSessionMutation.mutate()}
              disabled={createSessionMutation.isPending || loadingSession}
            >
              {createSessionMutation.isPending ? (
                "Creating..."
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-1" />
                  New Session
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingSession ? (
            <div className="h-52 flex items-center justify-center text-muted-foreground">Loading...</div>
          ) : session ? (
            <div className="flex flex-col items-center gap-3">
              {qrUrl && (
                <Image src={qrUrl} alt="Walk-in QR" className="rounded-lg border w-52 h-52 object-contain" fill />
              )}
              <p className="text-sm font-mono text-muted-foreground break-all max-w-xs text-center">
                {session.barcode}
              </p>
              {session.expiresAt && (
                <p className="text-xs text-muted-foreground">
                  Expires {new Date(session.expiresAt).toLocaleString()}
                </p>
              )}
            </div>
          ) : (
            <div className="h-52 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <p>No active session</p>
              <Button size="sm" onClick={() => createSessionMutation.mutate()} disabled={createSessionMutation.isPending}>
                Create Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Currently signed in */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Currently Signed In
          </CardTitle>
          <CardDescription>
            Students who have signed in today and not yet signed out.
          </CardDescription>
          <div className="pt-2">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loadingSignedIn ? (
            <div className="p-4 text-center text-muted-foreground">Loading...</div>
          ) : signedIn.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">No students signed in for this date</div>
          ) : (
            <div className="rounded-md border divide-y max-h-80 overflow-auto">
              {signedIn.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{r.studentName || "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{r.studentEmail}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      In: {r.signInTime ? new Date(r.signInTime).toLocaleTimeString() : "-"}
                      {r.method === "barcode" && (
                        <span className="ml-2 text-primary">(barcode)</span>
                      )}
                    </p>
                  </div>
                  {!r.signOutTime ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => signOut(r.id)}
                      disabled={signOutMutation.isPending && signOutMutation.variables === r.id}
                    >
                      <LogOut className="h-4 w-4 mr-1" />
                      {signOutMutation.isPending && signOutMutation.variables === r.id ? "..." : "Sign Out"}
                    </Button>
                  ) : (
                    <Badge variant="outline">
                      Signed Out ({r.signOutTime ? new Date(r.signOutTime).toLocaleTimeString() : "-"})
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff-assisted sign in */}
      <Card>
        <CardHeader>
          <CardTitle>Record Walk-in (Staff)</CardTitle>
          <CardDescription>
            Search for a student by name, email, or ID. Click to record their building entry.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or student ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-40"
            />
          </div>
          {searchQuery.length >= 2 && (
            <div className="rounded-md border divide-y max-h-64 overflow-auto">
              {isLoading ? (
                <div className="p-4 text-center text-muted-foreground">Searching...</div>
              ) : students.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">No students found</div>
              ) : (
                students.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div>
                      <p className="font-medium">{s.name}</p>
                      <p className="text-sm text-muted-foreground">{s.email}</p>
                    </div>
                    <Button size="sm" onClick={() => recordAttendance(s.id)}>
                      <UserCheck className="h-4 w-4 mr-1" />
                      Sign In
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
