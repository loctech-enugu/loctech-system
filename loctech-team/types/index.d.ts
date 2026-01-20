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
  role: "admin" | "staff" | "super_admin";
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
  } | null;

  students: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  }[];

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
  course: {
    id: string;
    name: string;
    code: string;
  } | null;
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
