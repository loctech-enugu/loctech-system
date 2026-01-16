"use client";

import { useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import validator from "validator";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import InputError from "../input-error";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { User } from "@/types";
import { useSession } from "next-auth/react";

interface CourseFormData {
  code: string;
  name: string;
  description: string | undefined;
  staff: string;
  isActive: boolean;
}

// -------------------- API Helpers --------------------

// Fetch staff (users who can handle courses)
async function fetchStaff() {
  const res = await fetch("/api/users?role=staff");
  if (!res.ok) throw new Error("Failed to fetch staff list");
  const data = await res.json();
  return data.data;
}

// Create new course
async function createCourse(data: CourseFormData) {
  const res = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const response = await res.json();
  if (!res.ok) throw new Error(response.error || "Failed to create course");
  return response;
}

// -------------------- Component --------------------

export default function AddCourseModal() {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const { data } = useSession();

  const [errors, setErrors] = useState<{
    code?: string;
    name?: string;
    staff?: string;
  }>({});

  // Fetch available staff
  const { data: staffList, isLoading: loadingStaff } = useQuery({
    queryKey: ["staff-list"],
    queryFn: fetchStaff,
  });

  const mutation = useMutation({
    mutationFn: createCourse,
    onSuccess: () => {
      toast.success("Course added successfully");
      formRef.current?.reset();
      router.refresh();
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  const validateForm = (formData: FormData): boolean => {
    const newErrors: typeof errors = {};

    const code = formData.get("code") as string;
    const name = formData.get("name") as string;
    const staff = formData.get("staff") as string;

    if (validator.isEmpty(code || ""))
      newErrors.code = "Course code is required.";
    if (validator.isEmpty(name || ""))
      newErrors.name = "Course name is required.";
    if (validator.isEmpty(staff || ""))
      newErrors.staff = "Select a staff handler.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const proceed = (formData: FormData) => {
    if (!validateForm(formData)) return;

    const payload: CourseFormData = {
      code: formData.get("code") as string,
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
      staff: formData.get("staff") as string,
      isActive: formData.get("isActive") === "true",
    };

    mutation.mutate(payload);
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
  if (!data || data.user.role === "staff") return null;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Add Course</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[450px] max-h-[95vh]">
        <DialogHeader>
          <DialogTitle>Add New Course</DialogTitle>
          <DialogDescription>
            Fill in the details to create a new course.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          ref={formRef}
          className="space-y-4"
          noValidate
        >
          {/* Course Code */}
          <div className="grid gap-2">
            <Label htmlFor="code">Course Code</Label>
            <Input
              id="code"
              name="code"
              placeholder="e.g. CSC101"
              className={cn(errors.code && "border-red-500")}
            />
            <InputError message={errors.code} />
          </div>

          {/* Course Name */}
          <div className="grid gap-2">
            <Label htmlFor="name">Course Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="Introduction to Computer Science"
              className={cn(errors.name && "border-red-500")}
            />
            <InputError message={errors.name} />
          </div>

          {/* Description */}
          <div className="grid gap-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              name="description"
              placeholder="Brief description of the course"
            />
          </div>

          {/* Staff */}
          <div className="grid gap-2">
            <Label htmlFor="staff">Handled By (Staff)</Label>
            <Select name="staff">
              <SelectTrigger>
                <SelectValue
                  placeholder={loadingStaff ? "Loading..." : "Select staff"}
                />
              </SelectTrigger>
              <SelectContent>
                {!loadingStaff && staffList?.length > 0 ? (
                  staffList.map((s: User) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} ({s.email})
                    </SelectItem>
                  ))
                ) : (
                  <></>
                )}
              </SelectContent>
            </Select>
            <InputError message={errors.staff} />
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2 pt-2">
            <Switch id="isActive" name="isActive" value="true" defaultChecked />
            <Label htmlFor="isActive">Active</Label>
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
            {mutation.isPending ? "Adding..." : "Add Course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
