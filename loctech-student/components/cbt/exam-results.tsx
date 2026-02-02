"use client";

// TODO: Copy this component from loctech-team/components/cbt/exam-results.tsx
// and update all API calls to use API_BASE_URL from @/lib/utils

import { API_BASE_URL } from "@/lib/utils";

interface ExamResultsProps {
  examId: string;
}

export default function ExamResults({ examId }: ExamResultsProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Exam Results</h2>
        <p className="text-muted-foreground">
          This component needs to be copied from loctech-team/components/cbt/exam-results.tsx
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Exam ID: {examId}
        </p>
      </div>
    </div>
  );
}
