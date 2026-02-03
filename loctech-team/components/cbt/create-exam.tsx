"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, type Resolver } from "react-hook-form";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import InputError from "../input-error";
import { useRouter } from "next/navigation";

async function fetchCourses() {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  return data.data || [];
}

async function fetchQuestions() {
  const res = await fetch("/api/questions");
  if (!res.ok) throw new Error("Failed to fetch questions");
  const data = await res.json();
  return data.data || [];
}

const createExamSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  totalQuestions: z.number().min(1, "At least 1 question required"),
  questionsPerStudent: z.number().min(0).optional(),
  passingScore: z.number().min(0).max(100),
  maxAttempts: z.number().min(1).default(1),
  scheduledStart: z.string().optional(),
  expirationDate: z.string().optional(),
  showCorrectAnswers: z.boolean().default(false),
  showDetailedFeedback: z.boolean().default(false),
  autoPublishResults: z.boolean().default(false),
  shuffleQuestions: z.boolean().default(false),
  courseId: z.string().optional(),
  questions: z.array(z.string()).min(1, "At least one question is required"),
});

type CreateExamForm = z.output<typeof createExamSchema>;

interface CreateExamProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateExam({ open, onOpenChange }: CreateExamProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedQuestions, setSelectedQuestions] = React.useState<string[]>(
    []
  );

  const { data: courses = [] } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const { data: questions = [] } = useQuery({
    queryKey: ["questions"],
    queryFn: fetchQuestions,
  });

  const form = useForm<CreateExamForm>({
    resolver: zodResolver(createExamSchema) as Resolver<CreateExamForm>,
    defaultValues: {
      maxAttempts: 1,
      showCorrectAnswers: false,
      showDetailedFeedback: false,
      autoPublishResults: false,
      shuffleQuestions: false,
      questions: [],
    },
  });

  const { mutate: createExam, isPending } = useMutation({
    mutationFn: async (data: CreateExamForm) => {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          questions: selectedQuestions,
          totalQuestions: selectedQuestions.length,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create exam");
      return result;
    },
    onSuccess: () => {
      toast.success("Exam created successfully");
      queryClient.invalidateQueries({ queryKey: ["exams"] });
      form.reset();
      setSelectedQuestions([]);
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error creating exam");
    },
  });

  const onSubmit = (values: CreateExamForm) => {
    if (selectedQuestions.length === 0) {
      toast.error("Please select at least one question");
      return;
    }
    createExam({ ...values, questions: selectedQuestions });
  };

  const toggleQuestion = (questionId: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(questionId)
        ? prev.filter((id) => id !== questionId)
        : [...prev, questionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Exam</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input id="title" {...form.register("title")} />
              <InputError message={form.formState.errors.title?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="courseId">Course (Optional)</Label>
              <Controller
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course: { id: string; title: string }) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              rows={3}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
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

            <div className="space-y-2">
              <Label htmlFor="maxAttempts">Max Attempts</Label>
              <Input
                id="maxAttempts"
                type="number"
                {...form.register("maxAttempts", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="scheduledStart">Scheduled Start</Label>
              <Input
                id="scheduledStart"
                type="datetime-local"
                {...form.register("scheduledStart")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="datetime-local"
                {...form.register("expirationDate")}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Options</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="shuffleQuestions"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Shuffle Questions</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="showCorrectAnswers"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Show Correct Answers</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="showDetailedFeedback"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Show Detailed Feedback</Label>
              </div>
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="autoPublishResults"
                  render={({ field }) => (
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
                <Label>Auto-Publish Results</Label>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Select Questions ({selectedQuestions.length} selected)</Label>
            <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
              {questions.length > 0 ? (
                <div className="space-y-2">
                  {
                    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
                    questions.map((question: any) => (
                      <div
                        key={question.id}
                        className="flex items-start gap-2 p-2 hover:bg-muted rounded"
                      >
                        <input
                          type="checkbox"
                          checked={selectedQuestions.includes(question.id)}
                          onChange={() => toggleQuestion(question.id)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {question.questionText || question.question}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {question.type} • {question.difficulty} •{" "}
                            {question.points} points
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No questions available. Create questions first.
                </p>
              )}
            </div>
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
              {isPending ? "Creating..." : "Create Exam"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
