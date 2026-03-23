"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, UserCheck } from "lucide-react";
import type { WalkInStudentSearchResult } from "@/types/walkin-attendance";

export type WalkInStaffSearchProps = {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedDate: string;
  onDateChange: (isoDate: string) => void;
  students: WalkInStudentSearchResult[];
  searching: boolean;
  onSignIn: (studentId: string) => void;
};

export function WalkInStaffSearch({
  searchQuery,
  onSearchChange,
  selectedDate,
  onDateChange,
  students,
  searching,
  onSignIn,
}: WalkInStaffSearchProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Record Walk-in (Staff)</CardTitle>
        <CardDescription>
          Search for a student by name, email, or ID. Click to record their
          building entry.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or student ID..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-40"
          />
        </div>
        {searchQuery.length >= 2 && (
          <div className="rounded-md border divide-y max-h-64 overflow-auto">
            {searching ? (
              <div className="p-4 text-center text-muted-foreground">
                Searching...
              </div>
            ) : students.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No students found
              </div>
            ) : (
              students.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between p-3 hover:bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">{s.email}</p>
                  </div>
                  <Button size="sm" onClick={() => onSignIn(s.id)}>
                    <UserCheck className="h-4 w-4 mr-1" />
                    Sign In
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
