"use client";

import * as React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
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
import InputError from "../input-error";
import { useRouter } from "next/navigation";

const editQuestionSchema = z.object({
  questionText: z.string().min(1, "Question is required"),
  correctAnswer: z.string().min(1, "Correct answer is required"),
  explanation: z.string().optional(),
  points: z.number().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  isActive: z.boolean(),
});

type EditQuestionForm = z.infer<typeof editQuestionSchema>;

interface EditQuestionProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  question: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditQuestion({
  question,
  open,
  onOpenChange,
}: EditQuestionProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const form = useForm<EditQuestionForm>({
    resolver: zodResolver(editQuestionSchema),
    defaultValues: {
      questionText: question?.questionText || question?.question || "",
      correctAnswer: question?.correctAnswer || "",
      explanation: question?.explanation || "",
      points: question?.points || 1,
      difficulty: question?.difficulty || "medium",
      isActive: question?.isActive ?? true,
    },
  });

  React.useEffect(() => {
    if (question) {
      form.reset({
        questionText: question.questionText || question.question || "",
        correctAnswer: question.correctAnswer || "",
        explanation: question.explanation || "",
        points: question.points || 1,
        difficulty: question.difficulty || "medium",
        isActive: question.isActive ?? true,
      });
    }
  }, [question, form]);

  const { mutate: updateQuestion, isPending } = useMutation({
    mutationFn: async (data: EditQuestionForm) => {
      const res = await fetch(`/api/questions/${question?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update question");
      return result;
    },
    onSuccess: () => {
      toast.success("Question updated successfully");
      queryClient.invalidateQueries({ queryKey: ["questions"] });
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error updating question");
    },
  });

  const onSubmit = (values: EditQuestionForm) => updateQuestion(values);

  if (!question) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="questionText">Question *</Label>
            <Textarea
              id="questionText"
              {...form.register("questionText")}
              rows={3}
            />
            <InputError
              message={form.formState.errors.questionText?.message}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="correctAnswer">Correct Answer *</Label>
            <Input id="correctAnswer" {...form.register("correctAnswer")} />
            <InputError
              message={form.formState.errors.correctAnswer?.message}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="points">Points *</Label>
              <Input
                id="points"
                type="number"
                {...form.register("points", { valueAsNumber: true })}
              />
              <InputError message={form.formState.errors.points?.message} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty *</Label>
              <Controller
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <InputError
                message={form.formState.errors.difficulty?.message}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="explanation">Explanation (Optional)</Label>
            <Textarea
              id="explanation"
              {...form.register("explanation")}
              rows={2}
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
