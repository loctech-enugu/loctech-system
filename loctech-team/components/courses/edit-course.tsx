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
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Course, User } from "@/types";
import InputError from "../input-error";
import { useRouter } from "next/navigation";

// -------------------- API Helpers --------------------
async function fetchStaff() {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch staff list");
  const data = await res.json();
  return data.data;
}

// -------------------- Schema --------------------
const editCourseSchema = z.object({
  isActive: z.boolean().optional(),
  instructor: z.string().min(1, "Staff is required"),
});

type EditCourseForm = z.infer<typeof editCourseSchema>;

// -------------------- Component --------------------
interface EditCourseProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditCourse({
  course,
  open,
  onOpenChange,
}: EditCourseProps) {
  const queryClient = useQueryClient();

  const router = useRouter();
  const { data: staffList, isLoading: loadingStaff } = useQuery({
    queryKey: ["staff-list"],
    queryFn: fetchStaff,
  });

  const form = useForm<EditCourseForm>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: {
      isActive: course?.isActive ?? true,
      instructor: course?.instructor?.id || "",
    },
  });

  // Reset when course changes
  React.useEffect(() => {
    if (course) {
      form.reset({
        isActive: course.isActive,
        instructor: course.instructor?.id || "",
      });
    }
  }, [course, form]);

  const { mutate: updateCourse, isPending } = useMutation({
    mutationFn: async (data: EditCourseForm) => {
      const res = await fetch(`/api/courses/${course?.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to update course");
      return result;
    },
    onSuccess: () => {
      toast.success("Course updated successfully");
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      onOpenChange(false);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Error updating course");
    },
  });

  const onSubmit = (values: EditCourseForm) => updateCourse(values);

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Staff */}
          <div className="grid gap-2">
            <Label htmlFor="staff">Handled By (Instructor)</Label>
            <Controller
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        loadingStaff ? "Loading..." : "Select staff member"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {!loadingStaff &&
                      staffList?.map((s: User) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} ({s.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              )}
            />
            <InputError message={form.formState.errors.instructor?.message} />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-2">
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <>
                  <Switch
                    id="isActive"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="isActive">Active</Label>
                </>
              )}
            />
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
