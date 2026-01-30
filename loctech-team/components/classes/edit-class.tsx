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
import { Class, User } from "@/types";
import InputError from "../input-error";
import { useRouter } from "next/navigation";
import { ScheduleInput } from "./schedule-input";

async function fetchInstructors() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch instructors");
  const data = await res.json();
  return data.data || [];
}

const editClassSchema = z.object({
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

type EditClassForm = z.infer<typeof editClassSchema>;

interface EditClassProps {
  classItem: Class | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditClass({
  classItem,
  open,
  onOpenChange,
}: EditClassProps) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: instructors = [], isLoading: loadingInstructors } = useQuery({
    queryKey: ["instructors"],
    queryFn: fetchInstructors,
  });

  const form = useForm<EditClassForm>({
    resolver: zodResolver(editClassSchema),
    defaultValues: {
      instructorId: classItem?.instructorId || "",
      name: classItem?.name || "",
      schedule: classItem?.schedule
        ? {
          daysOfWeek: (classItem.schedule as any)?.daysOfWeek || [],
          startTime: (classItem.schedule as any)?.startTime || "",
          endTime: (classItem.schedule as any)?.endTime || "",
          timezone: (classItem.schedule as any)?.timezone || "Africa/Lagos",
        }
        : {
          daysOfWeek: [],
          startTime: "",
          endTime: "",
          timezone: "Africa/Lagos",
        },
      capacity: classItem?.capacity,
      status: (classItem?.status as any) || "active",
    },
  });

  React.useEffect(() => {
    if (classItem) {
      form.reset({
        instructorId: classItem.instructorId || "",
        name: classItem.name || "",
        schedule: classItem.schedule
          ? {
            daysOfWeek: (classItem.schedule as any)?.daysOfWeek || [],
            startTime: (classItem.schedule as any)?.startTime || "",
            endTime: (classItem.schedule as any)?.endTime || "",
            timezone: (classItem.schedule as any)?.timezone || "Africa/Lagos",
          }
          : {
            daysOfWeek: [],
            startTime: "",
            endTime: "",
            timezone: "Africa/Lagos",
          },
        capacity: classItem.capacity,
        status: (classItem.status as any) || "active",
      });
    }
  }, [classItem, form]);

  const { mutate: updateClass, isPending } = useMutation({
    mutationFn: async (data: EditClassForm) => {
      const res = await fetch(`/api/classes/${classItem?.id}`, {
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
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error updating class");
    },
  });

  const onSubmit = (values: EditClassForm) => updateClass(values);

  if (!classItem) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Class</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
