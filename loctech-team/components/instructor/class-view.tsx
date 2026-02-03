"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Calendar, QrCode, } from "lucide-react";
import { toast } from "sonner";
import Enrollments from "@/components/enrollments";
import { format } from "date-fns";
import Link from "next/link";

async function fetchClass(classId: string) {
  const res = await fetch(`/api/classes/${classId}`);
  if (!res.ok) throw new Error("Failed to fetch class");
  const data = await res.json();
  return data.data;
}

async function generatePIN(classId: string) {
  const res = await fetch(`/api/attendance/classes/${classId}/pin`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to generate PIN");
  }
  return res.json();
}

async function generateBarcode(classId: string) {
  const res = await fetch(`/api/attendance/classes/${classId}/barcode`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to generate barcode");
  }
  return res.json();
}

interface InstructorClassViewProps {
  classId: string;
}

export default function InstructorClassView({ classId }: InstructorClassViewProps) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _queryClient = useQueryClient();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_generatedPIN, setGeneratedPIN] = React.useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_generatedBarcode, setGeneratedBarcode] = React.useState<string | null>(null);

  const { data: classItem, isLoading } = useQuery({
    queryKey: ["class", classId],
    queryFn: () => fetchClass(classId),
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _generatePINMutation = useMutation({
    mutationFn: () => generatePIN(classId),
    onSuccess: (data) => {
      setGeneratedPIN(data.data.pin);
      toast.success("PIN generated successfully");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate PIN";
      toast.error(errorMessage);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _generateBarcodeMutation = useMutation({
    mutationFn: () => generateBarcode(classId),
    onSuccess: (data) => {
      setGeneratedBarcode(data.data.barcode);
      toast.success("Barcode generated successfully");
    },
    onError: (error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : "Failed to generate barcode";
      toast.error(errorMessage);
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  if (isLoading) {
    return <div>Loading class details...</div>;
  }

  if (!classItem) {
    return <div>Class not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* Class Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">{classItem.name}</CardTitle>
              <CardDescription>
                {classItem.course?.title || "No course assigned"}
              </CardDescription>
            </div>
            <Badge
              className={
                classItem.status === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-200 text-gray-800"
              }
            >
              {classItem.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Schedule:</strong> {classItem.schedule || "TBD"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">
                <strong>Capacity:</strong> {classItem.capacity || "Unlimited"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                <strong>Created:</strong> {format(classItem.createdAt, "MM/dd/yyyy")}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Codes */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Codes</CardTitle>
          <CardDescription>{`View today's PIN and barcode for class attendance`}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href={`/dashboard/classes/${classId}/attendance/codes`}>
              <QrCode className="mr-2 h-4 w-4" />
              View Today&apos;s Attendance Codes
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Display today&apos;s PIN and QR code for students to sign in. Codes are valid for the entire day.
          </p>
        </CardContent>
      </Card>

      {/* Class Management Tabs */}
      <Tabs defaultValue="enrollments" className="w-full">
        <TabsList>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Records</TabsTrigger>
        </TabsList>
        <TabsContent value="enrollments">
          <Enrollments classId={classId} />
        </TabsContent>
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>View and manage class attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Attendance records will be displayed here. Navigate to the attendance page for detailed views.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
