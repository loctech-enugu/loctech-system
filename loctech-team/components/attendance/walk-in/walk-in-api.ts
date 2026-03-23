import type {
  WalkInSignedInRecord,
  WalkInSession,
  WalkInStudentSearchResult,
} from "@/types/walkin-attendance";

export async function searchWalkInStudents(
  query: string
): Promise<WalkInStudentSearchResult[]> {
  if (!query || query.length < 2) return [];
  const res = await fetch(
    `/api/attendance/walk-in/search?q=${encodeURIComponent(query)}`,
    { credentials: "include" }
  );
  if (!res.ok) throw new Error("Search failed");
  const data = await res.json();
  return data.data ?? [];
}

export async function fetchWalkInSignedIn(
  date?: string
): Promise<WalkInSignedInRecord[]> {
  const url = date
    ? `/api/attendance/walk-in?date=${date}`
    : "/api/attendance/walk-in";
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch");
  const data = await res.json();
  return data.data ?? [];
}

export async function fetchWalkInSession(): Promise<WalkInSession | null> {
  const res = await fetch("/api/attendance/walk-in/session", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch session");
  const data = await res.json();
  return data.data ?? null;
}
