"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key, QrCode, GraduationCap, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SignatureLoader from "@/components/loaders/signature";

async function fetchStudentEnrollments() {
  const res = await fetch("/api/enrollments/student/me", {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch enrollments");
  const data = await res.json();
  return data.data || [];
}

async function recordAttendance(data: {
  studentId: string;
  classId: string;
  date: string;
  status: "present";
  method: "pin" | "barcode";
  pin?: string;
  barcode?: string;
}) {
  const res = await fetch("/api/attendance/classes/record", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const result = await res.json();
    throw new Error(result.error || "Failed to record attendance");
  }
  return res.json();
}

export default function StudentAttendanceSignIn() {
  const queryClient = useQueryClient();
  const [selectedClassId, setSelectedClassId] = React.useState<string>("");
  const [pin, setPin] = React.useState<string>("");
  const [barcode, setBarcode] = React.useState<string>("");
  const [success, setSuccess] = React.useState(false);

  const { data: enrollments = [] } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: fetchStudentEnrollments,
  });

  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");

  const recordAttendanceMutation = useMutation({
    mutationFn: recordAttendance,
    onSuccess: () => {
      toast.success("Attendance recorded successfully!");
      setSuccess(true);
      setPin("");
      setBarcode("");
      setSelectedClassId("");
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to record attendance");
    },
  });

  const handlePINSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !pin) {
      toast.error("Please select a class and enter a PIN");
      return;
    }

    const enrollment = activeEnrollments.find(
      (e: any) => e.classId === selectedClassId
    );
    if (!enrollment) {
      toast.error("Invalid class selection");
      return;
    }

    recordAttendanceMutation.mutate({
      studentId: enrollment.studentId,
      classId: selectedClassId,
      date: new Date().toISOString().split("T")[0],
      status: "present",
      method: "pin",
      pin: pin.trim(),
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !barcode) {
      toast.error("Please select a class and scan/enter barcode");
      return;
    }

    const enrollment = activeEnrollments.find(
      (e: any) => e.classId === selectedClassId
    );
    if (!enrollment) {
      toast.error("Invalid class selection");
      return;
    }

    recordAttendanceMutation.mutate({
      studentId: enrollment.studentId,
      classId: selectedClassId,
      date: new Date().toISOString().split("T")[0],
      status: "present",
      method: "barcode",
      barcode: barcode.trim(),
    });
  };

  if (success) {
    return (
      <div className="font-sans flex items-center justify-center p-6">
        <Card className="w-full max-w-xl border-emerald-100 shadow-sm">
          <CardHeader className="text-center">
            <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-500" />
            <CardTitle className="text-emerald-600 text-lg font-semibold">
              You're all set for today!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Great job! 🎉 You've successfully signed in for{" "}
              <span className="font-medium text-foreground">
                {new Date().toLocaleDateString()}
              </span>
              .
            </p>
            <Button variant="outline" onClick={() => setSuccess(false)}>
              Sign In Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="font-sans flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Attendance</CardTitle>
          <CardDescription>
            Sign in for your class using PIN or barcode
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recordAttendanceMutation.isPending ? (
            <SignatureLoader />
          ) : (
            <Tabs defaultValue="pin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="pin">
                  <Key className="mr-2 h-4 w-4" />
                  PIN
                </TabsTrigger>
                <TabsTrigger value="barcode">
                  <QrCode className="mr-2 h-4 w-4" />
                  Barcode
                </TabsTrigger>
              </TabsList>

              {/* Class Selection */}
              <div className="mt-6 space-y-2">
                <label className="block text-sm font-medium">Select Class</label>
                <div className="grid gap-3 md:grid-cols-2">
                  {activeEnrollments.map((enrollment: any) => (
                    <button
                      key={enrollment.id}
                      type="button"
                      onClick={() => setSelectedClassId(enrollment.classId)}
                      className={`p-4 border rounded-lg text-left transition-all hover:border-primary ${selectedClassId === enrollment.classId
                        ? "border-primary bg-primary/5"
                        : "border-gray-200"
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <GraduationCap className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div className="flex-1">
                          <p className="font-medium text-sm">
                            {enrollment.class?.name || "Unknown Class"}
                          </p>
                          {enrollment.class?.course && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {enrollment.class.course.title}
                            </p>
                          )}
                        </div>
                        {selectedClassId === enrollment.classId && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
                {activeEnrollments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No active classes found
                  </p>
                )}
              </div>

              {/* PIN Tab */}
              <TabsContent value="pin" className="mt-6">
                <form onSubmit={handlePINSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="pin" className="block text-sm font-medium">
                      Enter PIN
                    </label>
                    <Input
                      id="pin"
                      type="text"
                      placeholder="Enter 6-digit PIN"
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      maxLength={6}
                      required
                      className="text-center text-2xl font-mono tracking-widest"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter the PIN provided by your instructor
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedClassId || !pin || recordAttendanceMutation.isPending}
                  >
                    {recordAttendanceMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* Barcode Tab */}
              <TabsContent value="barcode" className="mt-6">
                <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="barcode" className="block text-sm font-medium">
                      Scan or Enter Barcode
                    </label>
                    <Input
                      id="barcode"
                      type="text"
                      placeholder="Scan barcode or enter code"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Scan the QR code with your device camera or enter the code manually
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!selectedClassId || !barcode || recordAttendanceMutation.isPending}
                  >
                    {recordAttendanceMutation.isPending ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
