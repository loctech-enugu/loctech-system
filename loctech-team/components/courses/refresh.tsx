"use client";

import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner"; // or your preferred toast lib
import { useRouter } from "next/navigation";

export function SyncCoursesButton() {
  const router = useRouter();
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/courses/sync", {
        method: "POST",
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to sync courses");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || "Courses synced successfully");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sync courses");
    },
  });

  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        onClick={() => syncMutation.mutate()}
        disabled={syncMutation.isPending}
        className="flex items-center gap-2"
      >
        {syncMutation.isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Syncing...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4" />
            Sync Courses
          </>
        )}
      </Button>
    </div>
  );
}
