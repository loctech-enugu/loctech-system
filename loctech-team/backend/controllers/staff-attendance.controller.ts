import { authConfig } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { getServerSession } from "next-auth";
import { AttendanceModel } from "../models/attendance.model";
import { StaffAttendance } from "@/types";
import { UserModel } from "../models/user.model";

export const formatStaffAttendance = (report: Record<string, unknown>) => {
  const user = report.user as Record<string, unknown>;
  const session = report.session as Record<string, unknown>;
  const excusedBy = report.excusedBy as Record<string, unknown> | undefined;
  const data: StaffAttendance = {
    id: String(report._id),
    user: {
      id: String(user._id),
      name: user.name as string,
      email: user.email as string,
      role: user.role as string,
      title: user.title as string,
    },
    time: (report.time as Date).toISOString(),
    session: {
      id: String(session._id),
      dateKey: session.dateKey as string,
    },
    isExcused: Boolean(report.isExcused),
    isLate: Boolean(report.isLate),
    excusedBy: excusedBy?.name as string | undefined,
    createdAt: (report.createdAt as Date).toISOString(),
    updatedAt: (report.updatedAt as Date).toISOString(),
  };
  return data;
};

export const getAllStaffAttendance = async (
  startDate?: string,
  endDate?: string
): Promise<StaffAttendance[]> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

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
  if (session.user.role === "staff") {
    filter.user = session.user.id;
  }
  console.log(filter, session.user.role);

  const attendances = await AttendanceModel.find({})
    .populate("user")
    .populate("excusedBy", "name email")
    .populate("session", "dateKey session")
    .lean();
  console.log("attendances: ", attendances);

  return attendances.map((report) => formatStaffAttendance(report));
};
export const getTodayAttendance = async (): Promise<StaffAttendance | null> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);

  if (!session) throw new Error("Unauthorized");

  // Build filter safely
  // eslint-disable-next-line
  const filter: Record<string, any> = {};

  // Only include today's date range (start to end of day)
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0));
  const endOfDay = new Date(today.setHours(23, 59, 59, 999));
  filter.time = { $gte: startOfDay, $lte: endOfDay };
  filter.user = session.user.id;

  const attendance = await AttendanceModel.findOne(filter)
    .populate("user")
    .populate("excusedBy", "name email")
    .populate("session", "dateKey session")
    .lean();

  console.log("Attendance:", attendance);

  if (!attendance) return null;

  return formatStaffAttendance(attendance);
};

export const getStaffAttendanceReport = async (
  startDate: string,
  endDate: string
): Promise<
  {
    user: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "staff" | "super_admin" | "instructor";
      title: string | null | undefined;
    };
    attendance: Record<string, StaffAttendance | null>;
  }[]
> => {
  await connectToDatabase();
  const session = await getServerSession(authConfig);
  if (!session) throw new Error("Unauthorized");

  // Only admin/super_admin should generate report
  if (session.user.role === "staff") {
    throw new Error("Access denied");
  }

  // Convert to date objects
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Generate all dateKeys (YYYY-MM-DD)
  const dateKeys: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    const dateKey = current.toISOString().split("T")[0];
    dateKeys.push(dateKey);
    current.setDate(current.getDate() + 1);
  }

  // Fetch all staff except super_admin
  const staffs = await UserModel.find({ role: { $ne: "super_admin" } }).lean();

  // Fetch attendance records within date range
  const attendances = await AttendanceModel.find({
    time: { $gte: start, $lte: end },
  })
    .populate("user")
    .populate("excusedBy", "name email")
    .populate("session", "dateKey")
    .lean();

  // Group attendances by userId and dateKey
  const attendanceMap = new Map<
    string,
    Record<string, StaffAttendance | null>
  >();

  for (const record of attendances) {
    const formatted = formatStaffAttendance(record);
    const userId = formatted.user.id;
    const dateKey = formatted.session.dateKey;
    if (!attendanceMap.has(userId)) {
      attendanceMap.set(userId, {});
    }
    attendanceMap.get(userId)![dateKey] = formatted;
  }

  // Build final report
  const report = staffs.map((staff) => {
    const userAttendance = attendanceMap.get(String(staff._id)) || {};
    const attendanceByDate: Record<string, StaffAttendance | null> = {};

    for (const dateKey of dateKeys) {
      attendanceByDate[dateKey] = userAttendance[dateKey] || null;
    }

    return {
      user: {
        id: String(staff._id),
        name: staff.name,
        email: staff.email,
        role: staff.role,
        title: staff.title,
      },
      attendance: attendanceByDate,
    };
  });

  return report;
};
