"use client";

import * as React from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Student } from "@/types";
import InputError from "../input-error";
import { useRouter } from "next/navigation";
import { Search, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

async function fetchStudents() {
  const res = await fetch("/api/students");
  if (!res.ok) throw new Error("Failed to fetch students");
  const data = await res.json();
  return data.data || [];
}

const createEnrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  status: z.enum(["active", "paused"]),
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
  const [searchQuery, setSearchQuery] = React.useState("");

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students"],
    queryFn: fetchStudents,
  });

  const filteredStudents = React.useMemo(() => {
    if (!searchQuery) return students;
    const query = searchQuery.toLowerCase();
    return students.filter((student: Student) =>
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query) ||
      student.phone?.toLowerCase().includes(query)
    );
  }, [students, searchQuery]);

  const form = useForm<CreateEnrollmentForm>({
    resolver: zodResolver(createEnrollmentSchema),
    defaultValues: {
      status: "active" as const,
    },
  });

  const selectedStudentId = form.watch("studentId");
  const selectedStudent = React.useMemo(() => {
    if (!selectedStudentId) return undefined;
    return students.find((s: Student) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  const handleStudentSelect = (studentId: string) => {
    form.setValue("studentId", studentId);
  };

  const handleClearSelection = () => {
    form.setValue("studentId", "");
    setSearchQuery("");
  };

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
            <Label htmlFor="studentId">Student *</Label>

            {/* Selected Student Display */}
            {selectedStudent && (
              <div className="flex items-center justify-between p-3 rounded-md border bg-muted/50">
                <div className="flex flex-col">
                  <span className="font-medium">{selectedStudent.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {selectedStudent.email} {selectedStudent.phone && `• ${selectedStudent.phone}`}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelection}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
                disabled={loadingStudents}
              />
            </div>

            {/* Student List */}
            {!selectedStudent && (
              <div className="border rounded-md">
                <ScrollArea className="h-[300px]">
                  {loadingStudents ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Loading students...
                    </div>
                  ) : filteredStudents.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      {searchQuery
                        ? "No students found matching your search"
                        : "No students available"}
                    </div>
                  ) : (
                    <div className="p-1">
                      {filteredStudents.map((student: Student) => {
                        const isSelected = form.watch("studentId") === student.id;
                        return (
                          <div
                            key={student.id}
                            onClick={() => handleStudentSelect(student.id)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors hover:bg-accent",
                              isSelected && "bg-accent border-2 border-primary"
                            )}
                          >
                            <div className="flex flex-col flex-1">
                              <span className="font-medium">{student.name}</span>
                              <span className="text-sm text-muted-foreground">
                                {student.email} {student.phone && `• ${student.phone}`}
                              </span>
                            </div>
                            {isSelected && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </div>
            )}

            <InputError message={form.formState.errors.studentId?.message} />
            {!loadingStudents && !selectedStudent && (
              <p className="text-xs text-muted-foreground">
                {filteredStudents.length} student{filteredStudents.length !== 1 ? "s" : ""} found
                {searchQuery && ` matching "${searchQuery}"`}
              </p>
            )}
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
