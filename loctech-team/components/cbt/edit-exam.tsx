"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, } from "react-hook-form";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import InputError from "../input-error";
import { useRouter } from "next/navigation";
import type { Exam } from "@/types";

const editExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.number().min(1),
  passingScore: z.number().min(0).max(100),
  maxAttempts: z.number().min(1),
});

type EditExamForm = z.infer<typeof editExamSchema>;

interface EditExamProps {
  exam: Exam | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditExam({
  exam,
  open,
  onOpenChange,
}: EditExamProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<EditExamForm>({
    resolver: zodResolver(editExamSchema),
    defaultValues: {
      title: exam?.title || "",
      description: exam?.description || "",
      duration: exam?.duration || 60,
      passingScore: exam?.passingScore || 50,
      maxAttempts: exam?.maxAttempts || 1,
    },
  });

  React.useEffect(() => {
    if (exam) {
      form.reset({
        title: exam.title || "",
        description: exam.description || "",
        duration: exam.duration || 60,
        passingScore: exam.passingScore || 50,
        maxAttempts: exam.maxAttempts || 1,
      });
    }
  }, [exam, form]);

  const { mutate: updateExam, isPending } = useMutation({
    mutationFn: async (data: EditExamForm) => {
      const res = await fetch(`/api/exams/${exam?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update exam");
      return result;
    },
    onSuccess: () => {
      toast.success("Exam updated successfully");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error updating exam");
    },
  });

  const onSubmit = (values: EditExamForm) => updateExam(values);

  if (!exam) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...form.register("title")} />
            <InputError message={form.formState.errors.title?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} rows={3} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                {...form.register("duration", { valueAsNumber: true })}
              />
              <InputError message={form.formState.errors.duration?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="passingScore">Passing Score (%) *</Label>
              <Input
                id="passingScore"
                type="number"
                {...form.register("passingScore", { valueAsNumber: true })}
              />
              <InputError
                message={form.formState.errors.passingScore?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxAttempts">Max Attempts</Label>
            <Input
              id="maxAttempts"
              type="number"
              {...form.register("maxAttempts", { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
