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
import { Class, User } from "@/types";
import InputError from "../input-error";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ScheduleInput } from "./schedule-input";
import { fetchInstructors } from "./create-class";


const editClassSchema = z.object({
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

type EditClassForm = z.infer<typeof editClassSchema>;

interface EditClassProps {
  classId: string;
  classItem: Class;
}

export default function EditClass({ classId, classItem }: EditClassProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: instructors = [], isLoading: loadingInstructors } = useQuery({
    queryKey: ["instructors"],
    queryFn: fetchInstructors,
  });

  const scheduleObj =
    classItem.schedule && typeof classItem.schedule === "object"
      ? classItem.schedule
      : null;

  const form = useForm<EditClassForm>({
    resolver: zodResolver(editClassSchema),
    defaultValues: {
      instructorId: classItem.instructorId || "",
      name: classItem.name || "",
      schedule: scheduleObj
        ? {
          daysOfWeek: scheduleObj.daysOfWeek ?? [],
          startTime: scheduleObj.startTime ?? "",
          endTime: scheduleObj.endTime ?? "",
          timezone: scheduleObj.timezone ?? "Africa/Lagos",
        }
        : {
          daysOfWeek: [],
          startTime: "",
          endTime: "",
          timezone: "Africa/Lagos",
        },
      capacity: classItem.capacity,
      status: classItem.status ?? "active",
    },
  });


  React.useEffect(() => {
    const s = classItem.schedule && typeof classItem.schedule === "object" ? classItem.schedule : null;
    form.reset({
      instructorId: classItem.instructor?.id || "",
      name: classItem.name || "",
      schedule: s
        ? {
          daysOfWeek: s.daysOfWeek ?? [],
          startTime: s.startTime ?? "",
          endTime: s.endTime ?? "",
          timezone: s.timezone ?? "Africa/Lagos",
        }
        : {
          daysOfWeek: [],
          startTime: "",
          endTime: "",
          timezone: "Africa/Lagos",
        },
      capacity: classItem.capacity,
      status: classItem.status ?? "active",
    });
  }, [classItem, form]);

  const { mutate: updateClass, isPending } = useMutation({
    mutationFn: async (data: EditClassForm) => {
      const res = await fetch(`/api/classes/${classId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update class");
      return result;
    },
    onSuccess: () => {
      toast.success("Class updated successfully");
      queryClient.invalidateQueries({ queryKey: ["classes"] });
      router.push("/dashboard/classes");
    },
    onError: (error) => {
      toast.error(error.message || "Error updating class");
    },
  });

  const onSubmit = (values: EditClassForm) => updateClass(values);

  return (
    <>
      <div className="mb-2 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Class</h1>
      </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
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
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </form>
    </>
  );
}
