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
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ComboSelect } from "@/components/combo-select";
import type { Course, User } from "@/types";
import InputError from "../input-error";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScheduleInput } from "./schedule-input";

export async function fetchCourses() {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  return data.data || [];
}

export async function fetchInstructors() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch instructors");
  const data = await res.json();
  return data.data || [];
}

const createClassSchema = z.object({
  courseId: z.string().min(1, "Course is required"),
  instructorId: z.string().min(1, "Instructor is required"),
  name: z.string().min(1, "Class name is required"),
  schedule: z.object({
    daysOfWeek: z.array(z.number().min(0).max(6)).min(1, "At least one day is required"),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    timezone: z.string(),
  }),
  capacity: z.number().optional(),
  status: z.enum(["active", "inactive", "completed"]),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

export default function CreateClass() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: courses = [], isLoading: loadingCourses } = useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
  });

  const { data: instructors = [], isLoading: loadingInstructors } = useQuery({
    queryKey: ["instructors"],
    queryFn: fetchInstructors,
  });



  const form = useForm<CreateClassForm>({
    resolver: zodResolver(createClassSchema),
    defaultValues: {
      status: "active",
      schedule: {
        daysOfWeek: [],
        startTime: "",
        endTime: "",
        timezone: "Africa/Lagos",
      },
      capacity: undefined
    },
  });

  const { mutate: createClass, isPending } = useMutation({
    mutationFn: async (data: CreateClassForm) => {
      const res = await fetch("/api/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create class");
      return result;
    },
    onSuccess: () => {
      toast.success("Class created successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      router.push("/dashboard/classes");
    },
    onError: (error) => {
      toast.error(error.message || "Error creating class");
    },
  });

  const onSubmit = (values: CreateClassForm) => {
    // Ensure status is set
    const data = {
      ...values,
      status: values.status || "active",
    };
    createClass(data);
  };

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Create Class</h1>
      </div>
      <div className="container">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-4">
            {/* Course */}
            <div className="grid gap-2">
              <Label htmlFor="courseId">Course</Label>
              <Controller
                control={form.control}
                name="courseId"
                render={({ field }) => (
                  <ComboSelect<Course>
                    items={courses}
                    placeholder={loadingCourses ? "Loading..." : "Select course"}
                    valueKey="id"
                    displayKey="title"
                    value={field.value}
                    onSelect={(course) => field.onChange(course.id)}
                  />
                )}
              />
              <InputError message={form.formState.errors.courseId?.message} />
            </div>

            {/* Instructor */}
            <div className="grid gap-2">
              <Label htmlFor="instructorId">Instructor</Label>
              <Controller
                control={form.control}
                name="instructorId"
                render={({ field }) => (
                  <ComboSelect<User>
                    items={instructors}
                    placeholder={loadingInstructors ? "Loading..." : "Select instructor"}
                    valueKey="id"
                    displayKey="name"
                    value={field.value}
                    onSelect={(instructor) => field.onChange(instructor.id)}
                  />
                )}
              />
              <InputError message={form.formState.errors.instructorId?.message} />
            </div>

            {/* Class Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Class Name</Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="e.g., Web Dev - Morning Batch"
              />
              <InputError message={form.formState.errors.name?.message} />
            </div>

            {/* Schedule */}
            <div className="grid gap-2">
              <Controller
                control={form.control}
                name="schedule"
                render={({ field }) => (
                  <ScheduleInput
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.schedule?.message}
                  />
                )}
              />
            </div>

            {/* Capacity */}
            <div className="grid gap-2">
              <Label htmlFor="capacity">Capacity (Optional)</Label>
              <Input
                id="capacity"
                type="number"
                {...form.register("capacity", { valueAsNumber: true })}
                placeholder="Maximum number of students"
              />
              <InputError message={form.formState.errors.capacity?.message} />
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
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              <InputError message={form.formState.errors.status?.message} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/classes">Cancel</Link>
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form></div>
    </>
  );
}
