import { LucideIcon } from "lucide-react";

export interface Auth {
  user: User;
}

export interface BreadcrumbItem {
  title: string;
  href: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export interface NavItem {
  title: string;
  href: string;
  icon?: LucideIcon | null;
  isActive?: boolean;
  isAdmin?: boolean;
}
export interface User {
  id: string;
  email: string;
  name: string;
  role: "admin" | "staff" | "super_admin" | "instructor";
  title?: string; // optional for super_admin
  isActive: boolean;
  createdAt: Date;
  phone: string;
  bankDetails: { [key: string]: unknown } | undefined;
  [key: string]: unknown; // This allows for additional properties...
}
export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};
export type DailyReport = {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
    email: string;
    title: string;
  };
  date: string;
  title: string;
  summary?: string;
  tasksCompleted?: string[];
  blockers?: string;
  planForTomorrow?: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  reviewedBy?: string;
  isLate: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};
export type StaffAttendance = {
  id: string;
  user: {
    id: string;
    name: string;
    role: string;
    email: string;
    title: string;
  };
  time: string;
  session: {
    id: string;
    dateKey: string;
  };
  isExcused: boolean;
  excusedBy?: string;
  isLate: boolean;
  createdAt: string;
  updatedAt: string;
};

export interface Course {
  id: string;
  courseRefId: string;
  title: string;
  description: string | null;
  amount: number;
  img: string | null;
  category: string | null;
  duration: string | null;
  mode: string | null;
  level: string | null;
  learning: string[];
  requirement: string[];
  overview: string | null;
  videoUrl: string | null;
  curriculumUrl: string | null;
  featured: boolean;
  slug: string;
  isActive: boolean;

  instructor: {
    id: string;
    name: string;
    email: string;
  } | null; // Deprecated - use instructors array

  instructors: {
    id: string;
    name: string;
    email: string;
  }[];

  students: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  }[]; // Deprecated - students enroll via classes

  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  address: string;
  dateOfBirth: string; // ISO string when serialized
  highestQualification: string;
  phone: string;
  stateOfOrigin: string;
  nationality: string;
  occupation: string;
  heardFrom:
    | "Google"
    | "Facebook"
    | "Twitter"
    | "Others"
    | "Loctech Website"
    | "Radio"
    | "Billboard"
    | "Instagram"
    | "Flyers"
    | "Friends"
    | "Other";
  status: "active" | "graduated" | "suspended";
  hasPassword: boolean;
  nextOfKin: {
    name: string;
    relationship: string;
    contact: string;
  };

  courses: {
    id: string;
    title: string;
    category?: string;
  }[];

  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAttendance {
  id: string;
  student: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  class: {
    id: string;
    name: string;
    courseId: string;
  } | null; // Changed from course to class
  staff: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  date: string | null;
  status: "present" | "absent" | "late" | "excused";
  signInTime: string | null;
  signOutTime: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Class {
  id: string;
  courseId: string;
  instructorId: string;
  name: string;
  schedule: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    timezone?: string;
  } | string; // Support both new object format and legacy string format
  capacity?: number;
  status: "active" | "inactive" | "completed";
  course?: {
    id: string;
    title: string;
    courseRefId: string;
  };
  instructor?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  classId: string;
  status: "active" | "paused" | "completed" | "dropped";
  pauseReason?: string;
  startDate: string;
  endDate?: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
    courseId: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  studentId: string;
  classId: string;
  type: "absence_streak" | "enrollment_paused" | "exam_reminder";
  absenceStreak?: number;
  notifiedBy?: string;
  emailSent: boolean;
  sentAt: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
  message?: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ClassAttendance {
  id: string;
  studentId: string;
  classId: string;
  date: string;
  status: "present" | "absent" | "late" | "excused";
  method: "manual" | "pin" | "barcode";
  pin?: string;
  recordedBy?: string;
  signInTime?: string;
  signOutTime?: string;
  notes?: string;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  class?: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  duration: number; // minutes
  totalQuestions: number;
  questionsPerStudent: number;
  shuffleQuestions: boolean;
  passingScore: number; // percentage 0-100
  maxAttempts: number;
  status: "draft" | "published" | "ongoing" | "completed" | "cancelled";
  scheduledStart?: string;
  expirationDate?: string;
  autoPublishResults: boolean;
  showCorrectAnswers: boolean;
  showDetailedFeedback: boolean;
  questions: string[]; // Question IDs
  courseId?: string;
  classIds?: string[];
  createdBy: string;
  requireMinimumAttendance?: boolean;
  minimumAttendancePercentage?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Question {
  id: string;
  type: "MCQ" | "True/False" | "Essay" | "Fill-in-the-Blank" | "Matching";
  questionText: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  difficulty: "Easy" | "Medium" | "Hard";
  category?: string;
  points: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserExam {
  id: string;
  userId: string;
  examId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED" | "EXPIRED" | "CANCELLED" | "VIOLATED";
  score: number;
  percentage: number;
  attempts: number;
  startTime?: string;
  endTime?: string;
  submittedAt?: string;
  violations: number;
  violationDetails: string[];
  isPassed: boolean;
  resultsPublished: boolean;
  questionsAttempted: string[];
  exam?: {
    id: string;
    title: string;
    duration: number;
    totalQuestions: number;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserAnswer {
  id: string;
  userExamId: string;
  questionId: string;
  answer: string | string[];
  isCorrect: boolean;
  pointsEarned: number;
  timeSpent: number; // seconds
  flaggedForReview: boolean;
  question?: {
    id: string;
    question: string;
    type: string;
    options?: string[];
    correctAnswer: string | string[];
    points: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string; // HTML
  type:
    | "registration_success"
    | "exam_published"
    | "exam_submission_confirmation"
    | "result_published"
    | "admin_student_registration"
    | "exam_reminder"
    | "system_notification"
    | "absence_notification"
    | "password_reset";
  variables: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailLog {
  id: string;
  templateId?: string;
  recipientEmail: string;
  subject: string;
  status: "pending" | "sent" | "failed" | "delivered" | "bounced";
  errorMessage?: string;
  sentAt?: string;
  context?: Record<string, any>;
  template?: {
    id: string;
    name: string;
    type: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  // ============ General / Today’s Overview ============
  todayAttendance:
    | {
        // For admin/super_admin
        signedIn: number;
        total: number;
        rate: string;
      }
    | {
        // For staff
        status: string;
        time?: Date | string;
      }
    | null;

  reportsToday: number | null;

  pendingActions: {
    type: string; // e.g. "staff_not_signed_in", "courses_without_instructors"
    count: number;
    //eslint-disable-next-line
    data: Record<string, any>[];
  }[];

  summary: {
    attendanceRate?: number;
    totalReports?: number;
    totalCourses?: number;
    totalStudents?: number;
    totalStaff?: number;
  };

  analytics: AnalyticsData;
}

export interface AnalyticsData {
  // ============ Attendance Analytics ============
  attendance: {
    weekly: AttendanceTrend[];
    monthly: AttendanceTrend[];
    averageRate: number; // % average attendance rate
  };

  // ============ Report Analytics ============
  reports: {
    weekly: ReportTrend[];
    monthly: ReportTrend[];
    totalReports: number;
    reviewedReports: number;
    pendingReports: number;
  };

  // ============ Student Analytics ============
  students: {
    weeklyAttendanceRate: number;
    missedClassesLast7Days: number;
    totalActiveStudents: number;
  };

  // ============ Course Analytics ============
  courses: {
    totalCourses: number;
    withoutInstructors: number;
    averageEnrollmentPerCourse: number;
  };
}

// --------- Trend Interfaces ---------
export interface AttendanceTrend {
  date: string; // ISO Date (e.g. 2025-10-07)
  signedIn: number;
  total: number;
  rate: number; // e.g. 0.85 => 85%
}

export interface ReportTrend {
  date: string; // ISO Date
  submitted: number;
  reviewed: number;
}

export interface Announcement {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  title: string;
  content: string;
  author: {
    id: string;
    name: string;
    email: string | null;
  };
  audience: "all" | "staff" | "students";
  isActive: boolean;
  expiresAt?: Date | null | undefined;
}
