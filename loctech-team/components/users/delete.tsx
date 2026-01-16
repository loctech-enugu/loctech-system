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
import { cn } from "@/lib/utils";
import { User } from "@/types";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Spinner from "../spinner";
interface DeleteUserProps {
  user: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUserDeleted?: () => void; // Optional callback
}

// API call
async function deleteUser(data: User) {
  const res = await fetch(`/api/users/${data.id}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
  });
  const response = await res.json();
  if (!res.ok) throw new Error(response.error || "Failed to create user");
  return response;
}

const DeleteUser = ({ open, onOpenChange, user }: DeleteUserProps) => {
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      toast.success("User deleted successfully");
      router.refresh(); // refresh list after creation
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : "Unknown error";
      toast.error(message);
    },
  });

  return (
    <>
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => user && mutation.mutate(user)}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {mutation.isPending && (
        <div
          className={cn(
            "flex items-center justify-center fixed inset-0 z-40",
            "bg-background/50 backdrop-blur-lg"
          )}
        >
          <Spinner />
        </div>
      )}
    </>
  );
};

export default DeleteUser;
