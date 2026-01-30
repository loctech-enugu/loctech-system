"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import InputError from "../input-error";

interface ScheduleInputProps {
  value?: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    timezone?: string;
  };
  onChange: (schedule: {
    daysOfWeek: number[];
    startTime: string;
    endTime: string;
    timezone?: string;
  }) => void;
  error?: string;
}

const DAYS = [
  { value: 0, label: "Sunday", short: "Sun" },
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
];

export function ScheduleInput({
  value,
  onChange,
  error,
}: ScheduleInputProps) {
  const schedule = value || {
    daysOfWeek: [],
    startTime: "",
    endTime: "",
    timezone: "Africa/Lagos",
  };

  const handleDayToggle = (dayValue: number) => {
    const newDays = schedule.daysOfWeek.includes(dayValue)
      ? schedule.daysOfWeek.filter((d) => d !== dayValue)
      : [...schedule.daysOfWeek, dayValue].sort();
    
    onChange({
      ...schedule,
      daysOfWeek: newDays,
    });
  };

  const handleTimeChange = (field: "startTime" | "endTime", time: string) => {
    onChange({
      ...schedule,
      [field]: time,
    });
  };

  const handleTimezoneChange = (timezone: string) => {
    onChange({
      ...schedule,
      timezone,
    });
  };

  return (
    <div className="space-y-4">
      {/* Days of Week */}
      <div className="grid gap-2">
        <Label>Days of Week *</Label>
        <div className="flex flex-wrap gap-3">
          {DAYS.map((day) => (
            <div key={day.value} className="flex items-center space-x-2">
              <Checkbox
                id={`day-${day.value}`}
                checked={schedule.daysOfWeek.includes(day.value)}
                onCheckedChange={() => handleDayToggle(day.value)}
              />
              <label
                htmlFor={`day-${day.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {day.short}
              </label>
            </div>
          ))}
        </div>
        {error && !schedule.daysOfWeek.length && (
          <p className="text-sm text-destructive">At least one day is required</p>
        )}
      </div>

      {/* Time Range */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startTime">Start Time *</Label>
          <Input
            id="startTime"
            type="time"
            value={schedule.startTime}
            onChange={(e) => handleTimeChange("startTime", e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endTime">End Time *</Label>
          <Input
            id="endTime"
            type="time"
            value={schedule.endTime}
            onChange={(e) => handleTimeChange("endTime", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Timezone */}
      <div className="grid gap-2">
        <Label htmlFor="timezone">Timezone</Label>
        <select
          id="timezone"
          value={schedule.timezone || "Africa/Lagos"}
          onChange={(e) => handleTimezoneChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
          <option value="Africa/Abidjan">Africa/Abidjan (GMT)</option>
          <option value="Africa/Cairo">Africa/Cairo (EET)</option>
          <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
          <option value="UTC">UTC</option>
        </select>
      </div>

      {/* Preview */}
      {schedule.daysOfWeek.length > 0 && schedule.startTime && schedule.endTime && (
        <div className="rounded-md bg-muted p-3 text-sm">
          <p className="font-medium">Schedule Preview:</p>
          <p className="text-muted-foreground">
            {schedule.daysOfWeek
              .map((d) => DAYS.find((day) => day.value === d)?.label)
              .join(", ")}{" "}
            {schedule.startTime} - {schedule.endTime} ({schedule.timezone || "Africa/Lagos"})
          </p>
        </div>
      )}

      {error && <InputError message={error} />}
    </div>
  );
}
