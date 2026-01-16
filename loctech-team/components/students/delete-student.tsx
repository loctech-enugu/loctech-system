"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Student } from "@/types";

interface DeleteStudentProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

async function deleteStudent(id: string) {
  const res = await fetch(`/api/students/${id}`, { method: "DELETE" });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Failed to delete student");
  return json;
}

export default function DeleteStudent({
  student,
  open,
  onOpenChange,
}: DeleteStudentProps) {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: (id: string) => deleteStudent(id),
    onSuccess: () => {
      toast.success("Student deleted successfully");
      router.refresh();
      onOpenChange(false);
    },
    onError: (err) => {
      const msg =
        err instanceof Error ? err.message : "Failed to delete student";
      toast.error(msg);
    },
  });

  if (!student) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Student</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete <b>{student.name}</b>? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction asChild>
            <Button
              variant="destructive"
              onClick={() => mutation.mutate(student.id)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Deleting..." : "Yes, Delete"}
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
