"use client";
import { useEffect, useRef } from "react";

const QrRefresher = ({ date }: { date: string }) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, "0");
      const d = String(now.getUTCDate()).padStart(2, "0");
      const todayKey = `${y}-${m}-${d}`;
      if (todayKey !== date) {
        window.location.reload();
      }
    }, 10000); // check every 10 seconds

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [date]);

  return null;
};

export default QrRefresher;
