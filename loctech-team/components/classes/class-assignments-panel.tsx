"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type AssignmentRow = {
  id: string;
  title: string;
  description: string;
  classId: string;
  maxScore: number;
  dueDate: string;
  createdAt?: string;
};

type EnrollmentRow = {
  status: string;
  student: { id: string; name: string; email?: string } | null;
};

type GradeRow = {
  studentId: string;
  studentName?: string;
  score: number;
  feedback?: string;
};

async function fetchAssignments(classId: string): Promise<AssignmentRow[]> {
  const res = await fetch(`/api/assignments?classId=${encodeURIComponent(classId)}`);
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || j.message || "Failed to load assignments");
  return j.data ?? [];
}

async function fetchEnrollments(classId: string): Promise<EnrollmentRow[]> {
  const res = await fetch(`/api/enrollments/class/${encodeURIComponent(classId)}`);
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || j.message || "Failed to load enrollments");
  return j.data ?? [];
}

async function fetchGrades(assignmentId: string): Promise<GradeRow[]> {
  const res = await fetch(`/api/assignments/${assignmentId}/grades`);
  const j = await res.json();
  if (!res.ok) throw new Error(j.error || j.message || "Failed to load grades");
  return j.data ?? [];
}

function AssignmentGrades({
  assignment,
  maxScore,
  students,
}: {
  assignment: AssignmentRow;
  maxScore: number;
  students: { id: string; name: string; email?: string }[];
}) {
  const queryClient = useQueryClient();
  const { data: grades = [] } = useQuery({
    queryKey: ["assignment-grades", assignment.id],
    queryFn: () => fetchGrades(assignment.id),
  });

  const [draft, setDraft] = React.useState<Record<string, { score: string; feedback: string }>>(
    {}
  );

  React.useEffect(() => {
    const m = new Map<string, GradeRow>();
    for (const g of grades) {
      m.set(g.studentId, g);
    }
    const next: Record<string, { score: string; feedback: string }> = {};
    for (const s of students) {
      const g = m.get(s.id);
      next[s.id] = {
        score: g !== undefined && g.score !== null ? String(g.score) : "",
        feedback: g?.feedback ?? "",
      };
    }
    setDraft(next);
  }, [assignment.id, grades, students]);

  const saveMutation = useMutation({
    mutationFn: async ({
      studentId,
      score,
      fb,
    }: {
      studentId: string;
      score: number;
      fb: string;
    }) => {
      const res = await fetch(`/api/assignments/${assignment.id}/grades`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          score,
          feedback: fb,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Failed to save grade");
      return j;
    },
    onSuccess: () => {
      toast.success("Grade saved");
      queryClient.invalidateQueries({ queryKey: ["assignment-grades", assignment.id] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not save grade"),
  });

  return (
    <div className="rounded-md border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead className="w-[120px]">Score (max {maxScore})</TableHead>
            <TableHead>Feedback</TableHead>
            <TableHead className="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-muted-foreground text-sm">
                No enrolled students in this class.
              </TableCell>
            </TableRow>
          ) : (
            students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.email ?? ""}</div>
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min={0}
                    max={maxScore}
                    step={1}
                    className="h-9"
                    value={draft[s.id]?.score ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [s.id]: { ...prev[s.id], score: e.target.value, feedback: prev[s.id]?.feedback ?? "" },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    placeholder="Optional"
                    value={draft[s.id]?.feedback ?? ""}
                    onChange={(e) =>
                      setDraft((prev) => ({
                        ...prev,
                        [s.id]: { score: prev[s.id]?.score ?? "", feedback: e.target.value },
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={saveMutation.isPending}
                    onClick={() => {
                      const raw = draft[s.id]?.score?.trim();
                      if (raw === "" || raw === undefined) {
                        toast.error("Enter a score");
                        return;
                      }
                      const num = Number(raw);
                      if (Number.isNaN(num) || num < 0 || num > maxScore) {
                        toast.error(`Score must be between 0 and ${maxScore}`);
                        return;
                      }
                      saveMutation.mutate({
                        studentId: s.id,
                        score: num,
                        fb: draft[s.id]?.feedback ?? "",
                      });
                    }}
                  >
                    Save
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export default function ClassAssignmentsPanel({ classId }: { classId: string }) {
  const queryClient = useQueryClient();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [maxScore, setMaxScore] = React.useState("100");

  const { data: assignments = [], isLoading: loadingA } = useQuery({
    queryKey: ["assignments", classId],
    queryFn: () => fetchAssignments(classId),
  });

  const { data: enrollments = [], isLoading: loadingE } = useQuery({
    queryKey: ["enrollments-class", classId],
    queryFn: () => fetchEnrollments(classId),
  });

  const students = React.useMemo(() => {
    const list: { id: string; name: string; email?: string }[] = [];
    for (const e of enrollments) {
      if (e.status !== "active" && e.status !== "paused") continue;
      if (!e.student?.id) continue;
      list.push({
        id: e.student.id,
        name: e.student.name,
        email: e.student.email ?? undefined,
      });
    }
    return list;
  }, [enrollments]);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || !dueDate) {
        throw new Error("Title and due date are required");
      }
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          classId,
          dueDate: new Date(dueDate).toISOString(),
          maxScore: maxScore ? Number(maxScore) : 100,
        }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || j.message || "Failed to create");
      return j;
    },
    onSuccess: () => {
      toast.success("Assignment created");
      setTitle("");
      setDescription("");
      setDueDate("");
      setMaxScore("100");
      queryClient.invalidateQueries({ queryKey: ["assignments", classId] });
    },
    onError: (e) =>
      toast.error(e instanceof Error ? e.message : "Could not create assignment"),
  });

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Create assignment</CardTitle>
          <CardDescription>
            Add a task for this class. Students will see the title, description, and their grade on
            the student portal after you save scores.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-xl">
          <div className="grid gap-2">
            <Label htmlFor="as-title">Title</Label>
            <Input
              id="as-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. HTML/CSS landing page"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="as-desc">Description</Label>
            <Textarea
              id="as-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="What students should build or submit"
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
            <div className="grid gap-2">
              <Label htmlFor="as-due">Due date</Label>
              <Input
                id="as-due"
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="as-max">Max score</Label>
              <Input
                id="as-max"
                type="number"
                min={1}
                value={maxScore}
                onChange={(e) => setMaxScore(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="button"
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? "Creating…" : "Create assignment"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Assignments & grading</h2>
        {loadingA || loadingE ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : assignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assignments yet.</p>
        ) : (
          assignments.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle className="text-base">{a.title}</CardTitle>
                <CardDescription>
                  Due {a.dueDate ? format(new Date(a.dueDate), "PPp") : "—"} · Max score{" "}
                  {a.maxScore}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {a.description ? (
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{a.description}</p>
                ) : null}
                <AssignmentGrades assignment={a} maxScore={a.maxScore} students={students} />
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
