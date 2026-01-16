"use client";

import { StudentsTable } from "./table";
import { students } from "@/assets/students";

export interface Student {
  count: number;
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  preferredExamTime: string;
  educationLevel: string;
  courseOfInterest: string;
  password: string;
  status: string;
  requirePasswordChange: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  customFields: any;
  createdAt: string;
  updatedAt: string;
  lastLogin: string;
  userExams?:
    | {
        id: string;
        userId: string;
        examId: string;
        status: string;
        score: number;
        percentage: number;
        startTime: string;
        endTime: string;
        completedAt: string;
        timeSpent: number;
        isSubmitted: boolean;
        isPublishedForStudent: boolean;
        resultPublished: boolean;
        resultPublishedAt: null;
        attemptNumber: number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        exam: any;
      }[]
    | [];
}

function Students() {
  const data = students.map((o, i) => ({ ...o, count: i + 1 })) as Student[];
  return (
    <>
      <StudentsTable data={data} />
    </>
  );
}

export default Students;
