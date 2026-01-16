// hooks/useCalendarReport.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchData, postData, updateData, deleteData } from "@/lib/fetch-utils";
import type { DailyReport } from "@/types"; // <-- we will map from mongoose model
import { ApiResponse } from "@/types";

// ---------- Types ----------

export interface ReportFormData {
  title: string;
  summary?: string;
  tasksCompleted?: string[];
  blockers?: string;
  planForTomorrow?: string;
  status?: "draft" | "submitted" | "approved" | "rejected";
}

// ---------- Queries ----------

// Get all reports (optionally by date range)
export const useGetReports = (startDate?: string, endDate?: string) => {
  return useQuery<ApiResponse<DailyReport[]>>({
    queryKey: ["reports", startDate, endDate],
    queryFn: () =>
      fetchData(
        `/reports?${startDate ? `start=${startDate}&` : ""}${
          endDate ? `end=${endDate}` : ""
        }`
      ),
  });
};

// Get single report
export const useGetReport = (id: string) => {
  return useQuery<DailyReport>({
    queryKey: ["reports", id],
    queryFn: () => fetchData(`/reports/${id}`),
    enabled: !!id,
  });
};

// ---------- Mutations ----------

// Create
export const useCreateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReportFormData) => postData("/reports", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report created successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create report");
    },
  });
};

// Update
export const useUpdateReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; report: Partial<ReportFormData> }) =>
      updateData(`/reports/${data.id}`, data.report),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report updated successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update report");
    },
  });
};

// Delete
export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteData(`/reports/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reports"] });
      toast.success("Report deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete report");
    },
  });
};
