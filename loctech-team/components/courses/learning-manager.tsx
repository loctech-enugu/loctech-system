"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Editor } from "../editor/editor";

type LearningLesson = {
  id: string;
  title: string;
  slug?: string;
  order: number;
  contentHtml: string;
  estimatedMinutes: number;
  isPublished: boolean;
};

const emptyLesson: LearningLesson = {
  id: "",
  title: "",
  slug: "",
  order: 1,
  contentHtml: "",
  estimatedMinutes: 15,
  isPublished: false,
};

export default function LearningManager({ courseId }: { courseId: string }) {
  const queryClient = useQueryClient();
  const [form, setForm] = React.useState<LearningLesson>(emptyLesson);

  const { data: lessons = [] } = useQuery({
    queryKey: ["course-learning", courseId],
    queryFn: async () => {
      const res = await fetch(`/api/courses/${courseId}/learning`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load learning lessons");
      return (data.data || []) as LearningLesson[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const url = form.id
        ? `/api/courses/${courseId}/learning/${form.id}`
        : `/api/courses/${courseId}/learning`;
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save lesson");
      return data;
    },
    onSuccess: () => {
      toast.success("Learning lesson saved");
      setForm({ ...emptyLesson, order: lessons.length + 1 });
      queryClient.invalidateQueries({ queryKey: ["course-learning", courseId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save lesson"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      const res = await fetch(`/api/courses/${courseId}/learning/${lessonId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete lesson");
      return data;
    },
    onSuccess: () => {
      toast.success("Learning lesson deleted");
      queryClient.invalidateQueries({ queryKey: ["course-learning", courseId] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete lesson"),
  });

  return (
    <div className="space-y-8">
      <div className="space-y-4 rounded-md border p-4">
        <h2 className="text-lg font-semibold">
          {form.id ? "Edit learning lesson" : "Create learning lesson"}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Order</Label>
              <Input
                type="number"
                value={form.order}
                onChange={(e) => setForm((prev) => ({ ...prev, order: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Minutes</Label>
              <Input
                type="number"
                value={form.estimatedMinutes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, estimatedMinutes: Number(e.target.value) }))
                }
              />
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Lesson content</Label>
          <Editor value={form.contentHtml} onChange={(value) => setForm((p) => ({ ...p, contentHtml: value }))} />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              checked={form.isPublished}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isPublished: checked }))}
            />
            <Label>Published</Label>
          </div>
          <div className="flex gap-2">
            {form.id ? (
              <Button variant="outline" onClick={() => setForm({ ...emptyLesson, order: lessons.length + 1 })}>
                New lesson
              </Button>
            ) : null}
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? "Saving..." : "Save lesson"}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="font-semibold">Course lessons</h3>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lessons.map((lesson) => (
                <TableRow key={lesson.id}>
                  <TableCell>{lesson.order}</TableCell>
                  <TableCell>{lesson.title}</TableCell>
                  <TableCell>{lesson.isPublished ? "Published" : "Draft"}</TableCell>
                  <TableCell className="font-mono text-xs">{lesson.slug || "—"}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => setForm(lesson)}>
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteMutation.mutate(lesson.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {lessons.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground text-center">
                    No learning lessons yet.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
