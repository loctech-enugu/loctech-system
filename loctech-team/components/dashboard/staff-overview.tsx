"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "../ui/button";
import Link from "next/link";
import { getGreeting, userLinks } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { DashboardStats } from "@/types";
import { cn } from "@/lib/utils";
import { CalendarCheck, FileText, Sparkles } from "lucide-react";

export function DashboardBanner() {
  const { data } = useSession();

  return (
    <div className="space-y-2">
      {" "}
      {data && (
        <div>
          {getGreeting(data.user.name).greeting}
          {", "}
          {getGreeting(data.user.name).message}
        </div>
      )}
      <div className="rounded-xl bg-gradient-to-r from-[#12005f] to-secondary-700 p-6 text-white flex items-center justify-between shadow-md">
        <div>
          <div className="font-bold text-lg mb-1">
            {`Welcome to Loctech Training Institute Dashboard`}
          </div>
          <div className="text-sm">
            {`Track attendance, submit reports, and stay on top of team activities.`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function NewYearBanner() {
  const { data } = useSession();

  return (
    <div className="space-y-2">
      {/* Greeting */}
      {data && (
        <div className="text-sm">Happy New Year, {data.user.name}! 🎉</div>
      )}

      {/* Banner */}
      <div className="rounded-xl bg-gradient-to-r from-[#12005f] to-secondary-700 p-6 text-white flex items-center justify-between shadow-md">
        <div>
          <div className="font-bold text-lg mb-1 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            Wishing You a Prosperous New Year!
          </div>

          <div className="text-sm">
            May this year bring success, growth, and meaningful achievements in
            all your projects.
          </div>
        </div>
      </div>
    </div>
  );
}

interface StaffDashboardProps {
  stats: DashboardStats;
}

export function StaffDashboard({ stats }: StaffDashboardProps) {
  const attendance = stats.todayAttendance;
  const reportsToday = stats.reportsToday ?? 0;

  const attendanceStatus =
    typeof attendance === "object" &&
    attendance !== null &&
    "status" in attendance
      ? attendance.status
      : "unknown";

  const hasSignedIn = attendanceStatus === "present";
  const hasSubmittedReport = reportsToday > 0;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* --- Attendance Card --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Today’s Attendance</CardTitle>
          <CalendarCheck className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {attendance && "status" in attendance ? (
            <>
              <p className="text-sm text-muted-foreground">
                Status:{" "}
                <span
                  className={cn(
                    "font-medium",
                    attendance.status === "present"
                      ? "text-green-600"
                      : attendance.status === "absent"
                        ? "text-red-500"
                        : "text-muted-foreground"
                  )}
                >
                  {attendance.status.toUpperCase()}
                </span>
              </p>
              {attendance.time && (
                <p className="text-xs text-muted-foreground">
                  Time: {new Date(attendance.time).toLocaleTimeString()}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Attendance data unavailable.
            </p>
          )}

          {!hasSignedIn && (
            <Button className="w-fit mt-2" asChild>
              <Link href={userLinks.signIn}>Sign In for Today</Link>
            </Button>
          )}
        </CardContent>
      </Card>

      {/* --- Daily Report Card --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Daily Report</CardTitle>
          <FileText className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-muted-foreground">
            {hasSubmittedReport
              ? "You’ve already submitted your daily report. Great job!"
              : "Share your daily progress with the team."}
          </p>

          <Button
            variant={hasSubmittedReport ? "outline" : "default"}
            className="w-fit"
            asChild
          >
            <Link href={userLinks.reports}>
              {hasSubmittedReport ? "View My Report" : "Submit Report"}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default StaffDashboard;
