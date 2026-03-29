const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function formatClassScheduleLines(schedule: {
  daysOfWeek?: number[];
  startTime?: string;
  endTime?: string;
  timezone?: string;
} | null): { daysLine: string; timeLine: string; timezone?: string } {
  if (!schedule || typeof schedule !== "object") {
    return { daysLine: "To be confirmed", timeLine: "" };
  }
  const days =
    schedule.daysOfWeek?.length ?
      schedule.daysOfWeek.map((d) => DAY_LABELS[d] ?? String(d)).join(", ")
    : "";
  const timeLine =
    schedule.startTime && schedule.endTime ?
      `${schedule.startTime} – ${schedule.endTime}`
    : "";
  return {
    daysLine: days || "Days to be confirmed",
    timeLine,
    timezone: schedule.timezone,
  };
}
