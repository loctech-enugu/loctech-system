import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { AttendanceModel } from "../models/attendance.model";
import { DailyReportModel } from "../models/daily-report.model";
import { UserModel } from "../models/user.model";
import { CourseModel } from "../models/courses.model";
import { StudentModel } from "../models/students.model";

import type { DashboardStats, AttendanceTrend } from "@/types";
import { StudentAttendanceModel } from "../models/students-attendance.model";

export async function getDashboardStats(): Promise<DashboardStats> {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  const role = session.user.role;

  // ---------- Get today’s attendance ----------
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const [todayAttendance, totalStaff] = await Promise.all([
    AttendanceModel.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
    }),
    UserModel.countDocuments({ role: { $ne: "super_admin" } }),
  ]);

  const attendanceRate =
    totalStaff > 0 ? (todayAttendance / totalStaff) * 100 : 0;

  // ---------- Daily Reports (today) ----------
  const reportsToday = await DailyReportModel.countDocuments({
    createdAt: { $gte: today, $lt: tomorrow },
  });

  // ---------- Pending Actions ----------
  const unsignedStaff = await UserModel.find({
    role: "staff",
    _id: {
      $nin: await AttendanceModel.distinct("user", {
        createdAt: { $gte: today, $lt: tomorrow },
      }),
    },
  }).select("name email");

  const coursesWithoutInstructors = await CourseModel.find({
    $or: [{ instructor: { $exists: false } }, { instructor: null }],
  }).select("title code");

  const missedClassesLast7Days = await StudentAttendanceModel.countDocuments({
    status: "absent",
    date: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  });

  // ---------- Weekly Attendance Trend ----------
  const weeklyAttendance = await AttendanceModel.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        signedIn: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  // Fill missing days & compute rate
  const weeklyAttendanceFull: AttendanceTrend[] = [];
  const allStaffCount = totalStaff;
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const isoDate = date.toISOString().split("T")[0];
    const record = weeklyAttendance.find((r) => r._id === isoDate);
    const signedIn = record?.signedIn || 0;
    weeklyAttendanceFull.push({
      date: isoDate,
      signedIn,
      total: allStaffCount,
      rate: allStaffCount ? signedIn / allStaffCount : 0,
    });
  }

  // ---------- Monthly Attendance Trend ----------
  const monthlyAttendance = await AttendanceModel.aggregate([
    {
      $match: {
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
        signedIn: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const monthlyAttendanceFull = monthlyAttendance.map((r) => ({
    date: r._id,
    signedIn: r.signedIn,
    total: allStaffCount,
    rate: allStaffCount ? r.signedIn / allStaffCount : 0,
  }));

  const averageAttendanceRate =
    monthlyAttendanceFull.reduce((a, b) => a + b.rate, 0) /
      monthlyAttendanceFull.length || 0;

  // ---------- Weekly & Monthly Reports ----------
  const [weeklyReports, monthlyReports] = await Promise.all([
    DailyReportModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          submitted: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    DailyReportModel.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          submitted: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // ---------- Summary ----------
  const [totalCourses, totalStudents, totalReports, totalStaffCount] =
    await Promise.all([
      CourseModel.countDocuments(),
      StudentModel.countDocuments(),
      DailyReportModel.countDocuments(),
      UserModel.countDocuments({ role: "staff" }),
    ]);

  // ---------- Compose Response ----------
  const baseStats: DashboardStats = {
    todayAttendance:
      role === "staff"
        ? null
        : {
            signedIn: todayAttendance,
            total: totalStaff,
            rate: `${attendanceRate.toFixed(1)}%`,
          },
    reportsToday,
    pendingActions: [
      {
        type: "staff_not_signed_in",
        count: unsignedStaff.length,
        data: unsignedStaff,
      },
      {
        type: "courses_without_instructors",
        count: coursesWithoutInstructors.length,
        data: coursesWithoutInstructors,
      },
      {
        type: "students_missed_classes",
        count: missedClassesLast7Days,
        data: [],
      },
    ],
    summary: {
      attendanceRate,
      totalReports,
      totalCourses,
      totalStudents,
      totalStaff: totalStaffCount,
    },
    analytics: {
      attendance: {
        weekly: weeklyAttendanceFull,
        monthly: monthlyAttendanceFull,
        averageRate: averageAttendanceRate,
      },
      reports: {
        weekly: weeklyReports.map((r) => ({
          date: r._id,
          submitted: r.submitted,
          reviewed: 0, // could populate later
        })),
        monthly: monthlyReports.map((r) => ({
          date: r._id,
          submitted: r.submitted,
          reviewed: 0,
        })),
        totalReports,
        reviewedReports: 0,
        pendingReports: 0,
      },
      students: {
        weeklyAttendanceRate:
          weeklyAttendanceFull.reduce((a, b) => a + b.rate, 0) /
          weeklyAttendanceFull.length,
        missedClassesLast7Days,
        totalActiveStudents: totalStudents,
      },
      courses: {
        totalCourses,
        withoutInstructors: coursesWithoutInstructors.length,
        averageEnrollmentPerCourse: totalStudents / totalCourses || 0,
      },
    },
  };

  return JSON.parse(JSON.stringify(baseStats));
}
