import { connectToDatabase } from "@/lib/db";
import { DailyReport, DailyReportModel } from "../models/daily-report.model";
import { DailyReport as DailyReportType } from "@/types";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";
import { ClassAttendanceModel } from "../models/class-attendance.model";
import { EnrollmentModel } from "../models/enrollment.model";
import { ClassModel } from "../models/class.model";
import { getStudentClassGrade } from "./grades.controller";
import { auditLog } from "./audit-log.controller";

/**
 * Create a new daily report
 */

export const formatReport = (report: Record<string, unknown>) => {
  const user = report.user as Record<string, unknown>;
  const data: DailyReportType = {
    id: String(report._id),
    user: {
      id: String(user._id),
      name: user.name as string,
      email: user.email as string,
      role: user.role as string,
      title: user.title as string,
    },
    date: (report.date as Date).toISOString(),
    title: report.title as string,
    summary: report.summary as string | undefined,
    tasksCompleted: report.tasksCompleted as string[] | undefined,
    blockers: report.blockers as string | undefined,
    planForTomorrow: report.planForTomorrow as string | undefined,
    status: report.status as "draft" | "submitted" | "approved" | "rejected",
    reviewedBy: report.reviewedBy as string | undefined,
    isLate: Boolean(report.isLate),
    createdAt: (report.createdAt as Date).toISOString(),
    updatedAt: (report.updatedAt as Date).toISOString(),
  };
  return data;
};

export const createReport = async (
  data: Partial<DailyReport> & { user: string }
): Promise<DailyReport | null> => {
  try {
    await connectToDatabase();
    const session = await getServerSession(authConfig);

    // Normalize date to ensure uniqueness
    const reportDate = data.date ? new Date(data.date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const report = await DailyReportModel.create({
      ...data,
      date: reportDate,
    });

    await auditLog(session, {
      action: "create",
      resource: "daily_report",
      resourceId: String(report._id),
    });

    return report.toObject();
  } catch (error) {
    // Handle unique index violation (one report per user per day)
    const err = error as Record<string, unknown>;
    if (err.code && err.code === 11000) {
      throw new Error("A report already exists for this user today.");
    }
    console.error("Error creating report:", error);
    return null;
  }
};

/**
 * Get all reports (admin/staff)
 */
export const getAllReports = async (
  startDate?: string,
  endDate?: string
): Promise<DailyReportType[]> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");
  const isAdmin = session.user.role === "admin" || session.user.role === "super_admin";

  // eslint-disable-next-line
  const filter: Record<string, any> = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) {
      filter.date.$gte = new Date(startDate);
    }
    if (endDate) {
      filter.date.$lte = new Date(endDate);
    }
  }
  if (!isAdmin) {
    filter.user = session.user.id;
  }
  console.log(filter, session.user.role);

  const reports = await DailyReportModel.find(filter)
    .populate("user", "name email role")
    .populate("reviewedBy", "name email")
    .lean();

  return reports.map((report) => formatReport(report));
};

/**
 * Get a single report by ID
 */
export const getReportById = async (id: string): Promise<DailyReport> => {
  await connectToDatabase();
  try {
    const report = await DailyReportModel.findById(id)
      .populate("user", "name email role")
      .populate("reviewedBy", "name email")
      .lean();

    if (!report) {
      throw new Error(`Report with id ${id} not found`);
    }

    return report as DailyReport;
  } catch (error) {
    console.error(error);
    throw new Error(`Report with id ${id} not found`);
  }
};

/**
 * Update report (staff can edit if draft, admin can review)
 */
export const updateReport = async (
  id: string,
  data: Partial<DailyReport>
): Promise<DailyReport | null> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  const updated = await DailyReportModel.findByIdAndUpdate(id, data, {
    new: true,
  }).lean();
  if (updated) {
    await auditLog(session, {
      action: "update",
      resource: "daily_report",
      resourceId: id,
      details: { fields: Object.keys(data) },
    });
  }
  return updated;
};

/**
 * Delete report
 */
export const deleteReport = async (id: string): Promise<boolean> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  const res = await DailyReportModel.findByIdAndDelete(id);
  if (res) {
    await auditLog(session, {
      action: "delete",
      resource: "daily_report",
      resourceId: id,
    });
  }
  return !!res;
};

/**
 * Generate summarized report data for all users
 * Structured like the attendance report (user + date-based entries)
 */
export const generateReportSummary = async (
  startDate?: string,
  endDate?: string
) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // 🧭 Filters (date + role)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: Record<string, any> = {};
  if (startDate || endDate) {
    filter.date = {};
    if (startDate) filter.date.$gte = new Date(startDate);
    if (endDate) filter.date.$lte = new Date(endDate);
  }
  if (session.user.role === "staff") {
    filter.user = session.user.id;
  }

  const reports = await DailyReportModel.find(filter)
    .populate("user", "name email role title")
    .populate("reviewedBy", "name email")
    .sort({ date: 1 })
    .lean();

  // 🧮 Group reports by user
  const reportMap: Record<
    string,
    {
      user: {
        id: string;
        name: string;
        email: string;
        role: string;
        title?: string;
      };
      reports: Record<
        string,
        {
          title?: string;
          summary?: string;
          status?: string;
          isLate?: boolean;
          tasksCompleted?: string[];
          blockers?: string | null | undefined;
          planForTomorrow?: string | null | undefined;
          [key: string]: unknown; // This allows for additional properties...
        } | null
      >;
    }
  > = {};

  for (const r of reports) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const user = r.user as any;
    const dateKey = new Date(r.date).toISOString().split("T")[0]; // YYYY-MM-DD

    if (!reportMap[user._id]) {
      reportMap[user._id] = {
        user: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          role: user.role,
          title: user.title,
        },
        reports: {},
      };
    }

    reportMap[user._id].reports[dateKey] = {
      title: r.title,
      summary: r.summary != null ? r.summary : undefined,
      status: r.status,
      isLate: r.isLate,
      tasksCompleted: r.tasksCompleted,
      blockers: r.blockers,
      planForTomorrow: r.planForTomorrow,
    };
  }

  // 🗂️ Collect all dates across reports (for table header consistency)
  const allDates = Array.from(
    new Set(reports.map((r) => new Date(r.date).toISOString().split("T")[0]))
  ).sort();

  // 📊 Convert to array
  const summary = Object.values(reportMap).map((u) => ({
    user: u.user,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reports: allDates.reduce<Record<string, any>>((acc, date) => {
      acc[date] = u.reports[date] || null;
      return acc;
    }, {}),
  }));

  return {
    dates: allDates,
    data: summary,
  };
};
/**
 * Export attendance records as CSV data
 */
export const exportAttendanceCSV = async (params: {
  classId: string;
  startDate?: Date;
  endDate?: Date;
}) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const classDoc = await ClassModel.findById(params.classId).lean();
  if (!classDoc) throw new Error("Class not found");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    (session.user.role !== "instructor" ||
      String(classDoc.instructorId) !== session.user.id)
  ) {
    throw new Error("Forbidden");
  }

  const filter: Record<string, unknown> = { classId: params.classId };
  if (params.startDate || params.endDate) {
    filter.date = {};
    if (params.startDate) (filter.date as Record<string, Date>).$gte = params.startDate;
    if (params.endDate) (filter.date as Record<string, Date>).$lte = params.endDate;
  }

  const records = await ClassAttendanceModel.find(filter)
    .populate("studentId", "name email")
    .sort("date")
    .lean();

  const headers = "Date,Student Name,Student Email,Status,Method,Recorded At";
  const rows = records.map(
    (r) =>
      `${(r.date as Date).toISOString().split("T")[0]},${(r.studentId as { name?: string; email?: string })?.name ?? ""},${(r.studentId as { name?: string; email?: string })?.email ?? ""},${r.status},${r.method},${(r.recordedAt as Date)?.toISOString?.() ?? ""}`
  );

  await auditLog(session, {
    action: "update",
    resource: "export",
    resourceId: params.classId,
    details: { kind: "attendance_csv" },
  });

  return headers + "\n" + rows.join("\n");
};

/**
 * Export course roster as CSV
 */
export const exportCourseRosterCSV = async (classId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const classDoc = await ClassModel.findById(classId)
    .populate("courseId", "title courseRefId")
    .lean();
  if (!classDoc) throw new Error("Class not found");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    (session.user.role !== "instructor" ||
      String(classDoc.instructorId) !== session.user.id)
  ) {
    throw new Error("Forbidden");
  }

  const enrollments = await EnrollmentModel.find({ classId, status: "active" })
    .populate("studentId", "name email")
    .lean();

  const course = classDoc.courseId as { title?: string; courseRefId?: string };
  const headers = "Student ID,Name,Email,Status,Enrolled At";
  const rows = enrollments.map(
    (e) =>
      `${String((e.studentId) ?? "")},${(e.studentId as { name?: string })?.name ?? ""},${(e.studentId as { email?: string })?.email ?? ""},${e.status},${(e.enrolledAt as Date)?.toISOString?.() ?? ""}`
  );

  await auditLog(session, {
    action: "update",
    resource: "export",
    resourceId: classId,
    details: { kind: "roster_csv" },
  });

  return headers + "\n" + rows.join("\n");
};

/**
 * Export student progress/grade summary as CSV
 */
export const exportGradeSummaryCSV = async (classId: string) => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const classDoc = await ClassModel.findById(classId)
    .populate("courseId", "title")
    .lean();
  if (!classDoc) throw new Error("Class not found");

  if (
    session.user.role !== "admin" &&
    session.user.role !== "super_admin" &&
    (session.user.role !== "instructor" ||
      String(classDoc.instructorId) !== session.user.id)
  ) {
    throw new Error("Forbidden");
  }

  const enrollments = await EnrollmentModel.find({ classId, status: "active" })
    .populate("studentId", "name email")
    .lean();

  const headers =
    "Student ID,Name,Email,Attendance %,Assignment Avg,Exam Avg,Overall Grade,Passing";
  const rows: string[] = [];

  for (const e of enrollments) {
    const studentId = String((e.studentId) ?? e.studentId);
    const grade = await getStudentClassGrade(studentId, classId);
    rows.push(
      `${studentId},${(e.studentId as { name?: string })?.name ?? ""},${(e.studentId as { email?: string })?.email ?? ""},${grade.attendancePercentage.toFixed(1)},${grade.assignmentAverage.toFixed(1)},${grade.examAverage.toFixed(1)},${grade.overallGrade.toFixed(1)},${grade.isPassing ? "Yes" : "No"}`
    );
  }

  await auditLog(session, {
    action: "update",
    resource: "export",
    resourceId: classId,
    details: { kind: "grade_summary_csv" },
  });

  return headers + "\n" + rows.join("\n");
};