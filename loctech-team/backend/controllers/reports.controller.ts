import { connectToDatabase } from "@/lib/db";
import { DailyReport, DailyReportModel } from "../models/daily-report.model";
import { DailyReport as DailyReportType } from "@/types";
import { getServerSession } from "next-auth";
import { authConfig } from "@/lib/auth";

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

    // Normalize date to ensure uniqueness
    const reportDate = data.date ? new Date(data.date) : new Date();
    reportDate.setHours(0, 0, 0, 0);

    const report = await DailyReportModel.create({
      ...data,
      date: reportDate,
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
  return DailyReportModel.findByIdAndUpdate(id, data, {
    new: true,
  }).lean();
};

/**
 * Delete report
 */
export const deleteReport = async (id: string): Promise<boolean> => {
  await connectToDatabase();
  const res = await DailyReportModel.findByIdAndDelete(id);
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
