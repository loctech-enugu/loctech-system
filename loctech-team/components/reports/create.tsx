"use client";

import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import InputError from "../input-error";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ApiResponse } from "@/types";

// ✅ Define Zod schema
const reportSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must be less than 100 characters"),
  summary: z
    .string()
    .min(10, "Summary must be at least 10 characters")
    .max(500, "Summary must be less than 500 characters"),
  tasksCompleted: z
    .array(z.string().min(1))
    .nonempty("At least one completed task is required"),
  blockers: z.string().min(3, "Blockers field is required"),
  planForTomorrow: z.string().min(3, "Plan for tomorrow is required"),
});

type ReportForm = z.infer<typeof reportSchema>;

// Mock API request (replace with your backend)
async function submitReport(data: ReportForm) {
  const res = await fetch("/api/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const response = await res.json();
  if (!res.ok) throw new Error(response.error || "Failed to submit report");
  return response;
}

export default function SubmitReportModal() {
  const router = useRouter();
  const [tasks, setTasks] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useMutation({
    mutationFn: submitReport,
    onSuccess: (data: ApiResponse) => {
      router.replace("/dashboard/reports");
      toast.success(data.message);
      formRef.current?.reset();
      setTasks([]);
      setErrors({});
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  const handleAddTask = () => {
    if (taskInput.trim()) {
      setTasks([...tasks, taskInput.trim()]);
      setTaskInput("");
    }
  };

  const handleDeleteTask = (index: number) => {
    setTasks(tasks.filter((_, idx) => idx !== index));
  };

  const proceed = (formData: FormData) => {
    const data = {
      title: (formData.get("title") as string) || "",
      summary: (formData.get("summary") as string) || "",
      tasksCompleted: tasks,
      blockers: (formData.get("blockers") as string) || "",
      planForTomorrow: (formData.get("planForTomorrow") as string) || "",
    };

    // ✅ Zod validation
    const parsed = reportSchema.safeParse(data);

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0].toString()] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    mutation.mutate(parsed.data);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    proceed(formData);
  };

  const handleClick = () => {
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    proceed(formData);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Submit Report</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[98vh]">
        <DialogHeader>
          <DialogTitle>Submit Report</DialogTitle>
          <DialogDescription>
            Submit your daily report to the Loctech team.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              placeholder="Report title"
              className={cn(errors.title && "border-red-500")}
            />
            <InputError message={errors.title} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea
              id="summary"
              name="summary"
              placeholder="Short summary"
              className={cn(errors.summary && "border-red-500")}
            />
            <InputError message={errors.summary} />
          </div>

          <div className="grid gap-2">
            <Label>Tasks Completed</Label>
            <div className="flex gap-2">
              <Input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a task"
              />
              <Button type="button" onClick={handleAddTask}>
                Add
              </Button>
            </div>
            {errors.tasksCompleted && (
              <InputError message={errors.tasksCompleted} />
            )}
            <ul className="mt-2 space-y-1 list-disc pl-5">
              {tasks.map((task, idx) => (
                <li
                  key={idx}
                  className="text-sm flex justify-between items-center"
                >
                  <span>{task}</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDeleteTask(idx)}
                  >
                    Delete
                  </Button>
                </li>
              ))}
            </ul>
          </div>

          <Separator />

          <div className="grid gap-2">
            <Label htmlFor="blockers">Blockers</Label>
            <Textarea
              id="blockers"
              name="blockers"
              placeholder="What stopped progress?"
              className={cn(errors.blockers && "border-red-500")}
            />
            <InputError message={errors.blockers} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="planForTomorrow">Plan for Tomorrow</Label>
            <Textarea
              id="planForTomorrow"
              name="planForTomorrow"
              placeholder="Goals for tomorrow"
              className={cn(errors.planForTomorrow && "border-red-500")}
            />
            <InputError message={errors.planForTomorrow} />
          </div>

          <button type="submit" className="hidden" />
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </DialogClose>

          <Button
            type="submit"
            disabled={mutation.isPending}
            onClick={handleClick}
          >
            {mutation.isPending ? "Submitting..." : "Submit Report"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
