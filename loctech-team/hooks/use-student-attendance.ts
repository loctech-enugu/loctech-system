// hooks/useCalendarReport.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { fetchData, deleteData, postData, updateData } from "@/lib/fetch-utils";
import type { StudentAttendance } from "@/types"; // <-- we will map from mongoose model
import { ApiResponse } from "@/types";

// ---------- Queries ----------

// Get all reports (optionally by date range)
export const useGetReports = (
  courseId: string,
  startDate?: string,
  endDate?: string
) => {
  return useQuery<ApiResponse<StudentAttendance[]>>({
    queryKey: ["students-attendance", startDate, endDate],
    queryFn: () =>
      fetchData(
        `/attendance/${courseId}/students?${startDate ? `start=${startDate}&` : ""}${
          endDate ? `end=${endDate}` : ""
        }`
      ),
  });
};

// Get single report
export const useGetReport = (id: string) => {
  return useQuery<StudentAttendance>({
    queryKey: ["students-attendance", id],
    queryFn: () => fetchData(`/attendance/students/${id}`),
    enabled: !!id,
  });
};

// ---------- Mutations ----------

// Delete
export const useDeleteReport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteData(`/attendance/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["students-attendance"] });
      toast.success("Attendance deleted successfully");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete report");
    },
  });
};

type CourseAttendanceResponse = {
  data: {
    student: {
      id: string;
      name: string;
      email: string | null;
    };
    attendance: StudentAttendance | null;
  }[];
  success: true;
};

// GET attendance for a specific course & date
export const useGetCourseAttendance = (courseId?: string, date?: string) => {
  return useQuery<CourseAttendanceResponse>({
    queryKey: ["course-attendance", courseId, date],
    queryFn: () => fetchData(`/attendance/${courseId}/students/${date}`),
    enabled: !!courseId && !!date, // prevent fetch until both are available
  });
};

// 🔹 MUTATIONS

// Sign In
export const useSignInAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      postData(`/attendance/${payload.courseId}/students`, payload),
    onSuccess: () => {
      toast.success("Student signed in");
      queryClient.invalidateQueries({ queryKey: ["course-attendance"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to sign in student");
    },
  });
};

// Sign Out
export const useSignOutAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      updateData(`/attendance/${payload.courseId}/students`, payload),
    onSuccess: () => {
      toast.success("Student signed out");
      queryClient.invalidateQueries({ queryKey: ["course-attendance"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to sign out student");
    },
  });
};

// Mark Excused
export const useExcuseAttendance = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      postData(`/attendance/${payload}/students`, payload),
    onSuccess: () => {
      toast.success("Marked as excused");
      queryClient.invalidateQueries({ queryKey: ["course-attendance"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to mark as excused");
    },
  });
};
