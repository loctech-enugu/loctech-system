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
import { Input } from "@/components/ui/input";
import { User } from "@/types";
import InputError from "../input-error";
import { useRouter } from "next/navigation";
import { ScheduleInput } from "./schedule-input";
import { ScrollArea } from "../ui/scroll-area";

async function fetchCourses() {
  const res = await fetch("/api/courses");
  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  return data.data || [];
}

async function fetchInstructors() {
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
  capacity: z.number(),
  status: z.enum(["active", "inactive", "completed"]),
});

type CreateClassForm = z.infer<typeof createClassSchema>;

interface CreateClassProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateClass({ open, onOpenChange }: CreateClassProps) {
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
      form.reset();
      onOpenChange(false);
      router.refresh();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

          <ScrollArea className="h-[calc(100vh-200px)] space-y-4">
            <div className="space-y-4">
              {/* Course */}
              <div className="grid gap-2">
                <Label htmlFor="courseId">Course</Label>
                <Controller
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingCourses ? "Loading..." : "Select course"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!loadingCourses &&
                          courses.map((course: any) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingInstructors ? "Loading..." : "Select instructor"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {!loadingInstructors &&
                          instructors.map((instructor: User) => (
                            <SelectItem key={instructor.id} value={instructor.id}>
                              {instructor.name} ({instructor.email})
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
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
            </div>   </ScrollArea>

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
              {isPending ? "Creating..." : "Create Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
