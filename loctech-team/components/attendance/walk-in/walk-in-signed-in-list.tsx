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
import { Badge } from "@/components/ui/badge";
import { LogOut, Users } from "lucide-react";
import type { WalkInSignedInRecord } from "@/types/walkin-attendance";

export type WalkInSignedInListProps = {
  selectedDate: string;
  onDateChange: (isoDate: string) => void;
  records: WalkInSignedInRecord[];
  loading: boolean;
  onSignOut: (recordId: string) => void;
  isSigningOutRecord: (recordId: string) => boolean;
};

export function WalkInSignedInList({
  selectedDate,
  onDateChange,
  records,
  loading,
  onSignOut,
  isSigningOutRecord,
}: WalkInSignedInListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Currently Signed In
        </CardTitle>
        <CardDescription>
          Students who have signed in today and not yet signed out.
        </CardDescription>
        <div className="pt-2">
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => onDateChange(e.target.value)}
            className="w-40"
          />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading...</div>
        ) : records.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No students signed in for this date
          </div>
        ) : (
          <div className="rounded-md border divide-y max-h-80 overflow-auto">
            {records.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 hover:bg-muted/50"
              >
                <div>
                  <p className="font-medium">{r.studentName || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{r.studentEmail}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    In:{" "}
                    {r.signInTime
                      ? new Date(r.signInTime).toLocaleTimeString()
                      : "-"}
                    {r.method === "barcode" && (
                      <span className="ml-2 text-primary">(barcode)</span>
                    )}
                  </p>
                </div>
                {!r.signOutTime ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onSignOut(r.id)}
                    disabled={isSigningOutRecord(r.id)}
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    {isSigningOutRecord(r.id) ? "..." : "Sign Out"}
                  </Button>
                ) : (
                  <Badge variant="outline">
                    Signed Out (
                    {r.signOutTime
                      ? new Date(r.signOutTime).toLocaleTimeString()
                      : "-"}
                    )
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
