"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  duration: number; // in minutes
  onTimeUp?: () => void;
  startTime?: Date;
}

export function ExamTimer({ duration, onTimeUp, startTime }: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = React.useState(duration * 60); // in seconds
  const [isWarning, setIsWarning] = React.useState(false);
  const [isCritical, setIsCritical] = React.useState(false);

  React.useEffect(() => {
    if (!startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (new Date().getTime() - startTime.getTime()) / 1000
      );
      const remaining = duration * 60 - elapsed;

      if (remaining <= 0) {
        setTimeRemaining(0);
        if (onTimeUp) {
          onTimeUp();
        }
        clearInterval(interval);
        return;
      }

      setTimeRemaining(remaining);

      // Warning states
      const percentage = (remaining / (duration * 60)) * 100;
      setIsWarning(percentage <= 25 && percentage > 10);
      setIsCritical(percentage <= 10);
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, startTime, onTimeUp]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const percentage = (timeRemaining / (duration * 60)) * 100;

  return (
    <div className="flex items-center gap-3">
      <Clock
        className={cn(
          "h-5 w-5",
          isCritical && "text-red-600 animate-pulse",
          isWarning && !isCritical && "text-orange-600"
        )}
      />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span
            className={cn(
              "text-lg font-bold",
              isCritical && "text-red-600",
              isWarning && !isCritical && "text-orange-600"
            )}
          >
            {formatTime(timeRemaining)}
          </span>
          <span className="text-xs text-muted-foreground">
            {percentage.toFixed(0)}% remaining
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={cn(
              "h-2 rounded-full transition-all",
              isCritical && "bg-red-600",
              isWarning && !isCritical && "bg-orange-600",
              !isWarning && !isCritical && "bg-blue-600"
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    </div>
  );
}
