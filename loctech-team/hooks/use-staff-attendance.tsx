// hooks/useCalendarReport.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchData, deleteData } from "@/lib/fetch-utils";
import type { DailyReport, StaffAttendance } from "@/types"; // <-- we will map from mongoose model
import { ApiResponse } from "@/types";

// ---------- Queries ----------

// Get all reports (optionally by date range)
export const useGetReports = (startDate?: string, endDate?: string) => {
  return useQuery<ApiResponse<StaffAttendance[]>>({
    queryKey: ["staff-attendance", startDate, endDate],
    queryFn: () =>
      fetchData(
        `/attendance/staff?${startDate ? `start=${startDate}&` : ""}${
          endDate ? `end=${endDate}` : ""
        }`
      ),
  });
};

// Get single report
export const useGetReport = (id: string) => {
  return useQuery<DailyReport>({
    queryKey: ["staff-attendance", id],
    queryFn: () => fetchData(`/attendance/staff/${id}`),
    enabled: !!id,
  });
};

// ---------- Mutations ----------

// Delete
export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteData(`/attendance/staff/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staff-attendance"] });
      toast.success("Attendance deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete report");
    },
  });
};
