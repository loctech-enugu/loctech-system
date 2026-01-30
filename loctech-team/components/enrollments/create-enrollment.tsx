"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Student } from "@/types";
import InputError from "../input-error";
import { useRouter } from "next/navigation";

async function fetchStudents() {
  const res = await fetch("/api/students");
  if (!res.ok) throw new Error("Failed to fetch students");
  const data = await res.json();
  return data.data || [];
}

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  status: z.enum(["active", "paused"]).default("active"),
});

type CreateEnrollmentForm = z.infer<typeof createEnrollmentSchema>;

interface CreateEnrollmentProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateEnrollment({
  classId,
  open,
  onOpenChange,
}: CreateEnrollmentProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
  });

  const form = useForm<CreateEnrollmentForm>({
    resolver: zodResolver(createEnrollmentSchema),
    defaultValues: {
      status: "active",
    },
  });

  const { mutate: createEnrollment, isPending } = useMutation({
    mutationFn: async (data: CreateEnrollmentForm) => {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          classId,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create enrollment");
      return result;
    },
    onSuccess: () => {
      toast.success("Student enrolled successfully");
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      form.reset();
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error enrolling student");
    },
  });

  const onSubmit = (values: CreateEnrollmentForm) => createEnrollment(values);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enroll Student</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Student */}
          <div className="grid gap-2">
            <Label htmlFor="studentId">Student</Label>
            <Controller
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingStudents ? "Loading..." : "Select student"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingStudents &&
                      students.map((student: Student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name} ({student.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            <InputError message={form.formState.errors.studentId?.message} />
          </div>

          {/* Status */}
          <div className="grid gap-2">
            <Label htmlFor="status">Status</Label>
            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
            <InputError message={form.formState.errors.status?.message} />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Enrolling..." : "Enroll Student"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
