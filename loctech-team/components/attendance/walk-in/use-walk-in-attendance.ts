"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { WalkInSignedInRecord } from "@/types/walkin-attendance";
import {
  fetchWalkInSession,
  fetchWalkInSignedIn,
  searchWalkInStudents,
} from "./walk-in-api";

export function useWalkInAttendance() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  const { data: students = [], isLoading: searching } = useQuery({
    queryKey: ["walk-in-search", searchQuery],
    queryFn: () => searchWalkInStudents(searchQuery),
    enabled: searchQuery.length >= 2,
  });

  const { data: signedIn = [], isLoading: loadingSignedIn } = useQuery({
    queryKey: ["walk-in-signed-in", selectedDate],
    queryFn: () => fetchWalkInSignedIn(selectedDate),
  });

  const { data: session, isLoading: loadingSession } = useQuery({
    queryKey: ["walk-in-session"],
    queryFn: fetchWalkInSession,
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
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Failed to sign out"),
  });

  const isSigningOutRecord = (recordId: string) =>
    signOutMutation.isPending && signOutMutation.variables === recordId;

  return {
    searchQuery,
    setSearchQuery,
    selectedDate,
    setSelectedDate,
    students,
    searching,
    signedIn,
    loadingSignedIn,
    session,
    loadingSession,
    createSession: () => createSessionMutation.mutate(),
    isCreatingSession: createSessionMutation.isPending,
    recordAttendance,
    signOut: (recordId: string) => signOutMutation.mutate(recordId),
    isSigningOutRecord,
  };
}
