"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { Activity, Users, BookOpen, ClipboardList } from "lucide-react";
import { DashboardStats } from "@/types";

function AdminOverview({ stats }: { stats: DashboardStats }) {
  return (
    <div className="space-y-6">
      {/* ======= Top Overview ======= */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              {`Today’s Attendance`}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {stats.todayAttendance && "signedIn" in stats.todayAttendance ? (
              <>
                <p className="text-2xl font-semibold">
                  {stats.todayAttendance?.signedIn ?? 0} /{" "}
                  {stats.todayAttendance?.total ?? 0}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.todayAttendance?.rate ?? "0%"} attendance rate
                </p>
                <Progress
                  value={parseFloat(stats.todayAttendance?.rate || "0")}
                  className="mt-2"
                />
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Status: {stats.todayAttendance?.status || "Not Available"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Reports Submitted
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">{stats.reportsToday ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Daily reports today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {stats.summary.totalStaff ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Active staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex justify-between items-center">
            <CardTitle className="text-sm font-medium">
              Total Students
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">
              {stats.summary.totalStudents ?? 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled students
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ======= Pending Actions ======= */}
      <Card>
        <CardHeader>
          <CardTitle>Pending Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.pendingActions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No pending actions 🎉
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Count</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.pendingActions.map((action, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Badge
                        variant={
                          action.type === "staff_not_signed_in"
                            ? "destructive"
                            : "secondary"
                        }
                      >
                        {action.type.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell>{action.count}</TableCell>
                    <TableCell>
                      {/* eslint-disable-next-line */}
                      {action.data.slice(0, 3).map((item: any, j: number) => (
                        <span
                          key={j}
                          className={cn(
                            "text-sm mr-2",
                            action.type === "courses_without_instructors"
                              ? "text-blue-600"
                              : "text-amber-600"
                          )}
                        >
                          {item.name || item.title || "Unnamed"}
                        </span>
                      ))}
                      {action.data.length > 3 && (
                        <span className="text-xs text-muted-foreground">
                          +{action.data.length - 3} more
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminOverview;
