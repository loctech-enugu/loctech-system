"use client";

import * as React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Key, QrCode } from "lucide-react";
import { toast } from "sonner";

async function fetchStudentEnrollments() {
  const res = await fetch("/api/enrollments/student/me");
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

  const { data: enrollments = [] } = useQuery({
    queryKey: ["student-enrollments"],
    queryFn: fetchStudentEnrollments,
  });

  // eslint-disable-next-line
  const activeEnrollments = enrollments.filter((e: any) => e.status === "active");

  const recordAttendanceMutation = useMutation({
    mutationFn: recordAttendance,
    onSuccess: () => {
      toast.success("Attendance recorded successfully!");
      setPin("");
      setBarcode("");
      queryClient.invalidateQueries({ queryKey: ["student-attendance"] });
    },
    onError: (error) => {
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
      // eslint-disable-next-line
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
      // eslint-disable-next-line
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign In Attendance</CardTitle>
          <CardDescription>
            Use PIN or barcode to sign in for your class
          </CardDescription>
        </CardHeader>
        <CardContent>
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

            {/* PIN Tab */}
            <TabsContent value="pin">
              <form onSubmit={handlePINSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class-pin">Select Class</Label>
                  <select
                    id="class-pin"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Choose a class...</option>
                    {activeEnrollments.map(
                      // eslint-disable-next-line
                      (enrollment: any) => (
                        <option key={enrollment.id} value={enrollment.classId}>
                          {enrollment.class?.name || "Unknown Class"}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pin">Enter PIN</Label>
                  <Input
                    id="pin"
                    type="text"
                    placeholder="Enter attendance PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Enter the 6-digit PIN provided by your instructor
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={recordAttendanceMutation.isPending}
                >
                  {recordAttendanceMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>

            {/* Barcode Tab */}
            <TabsContent value="barcode">
              <form onSubmit={handleBarcodeSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="class-barcode">Select Class</Label>
                  <select
                    id="class-barcode"
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-md"
                    required
                  >
                    <option value="">Choose a class...</option>
                    {activeEnrollments.map(
                      // eslint-disable-next-line 
                      (enrollment: any) => (
                        <option key={enrollment.id} value={enrollment.classId}>
                          {enrollment.class?.name || "Unknown Class"}
                        </option>
                      ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Scan or Enter Barcode</Label>
                  <Input
                    id="barcode"
                    type="text"
                    placeholder="Scan barcode or enter code"
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Scan the barcode with your device camera or enter the code manually
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={recordAttendanceMutation.isPending}
                >
                  {recordAttendanceMutation.isPending ? "Signing In..." : "Sign In"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Using PIN
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Select the class you&apos;re attending</li>
              <li>Enter the 6-digit PIN provided by your instructor</li>
              <li>Click &quot;Sign In&quot; to record your attendance</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              Using Barcode
            </h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              <li>Select the class you&apos;re attending</li>
              <li>Scan the barcode displayed by your instructor or enter the code manually</li>
              <li>Click &quot;Sign In&quot; to record your attendance</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
