"use client";

import { Appearance } from "@/hooks/use-appearance";
import { cn } from "@/lib/utils";
import { LucideIcon, Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { HTMLAttributes } from "react";

export default function AppearanceToggleTab({
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  const { setTheme, theme } = useTheme();

  const tabs: { value: Appearance; icon: LucideIcon; label: string }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div
      className={cn(
        "inline-flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-primary-100",
        className
      )}
      {...props}
    >
      {tabs.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          className={cn(
            "flex items-center rounded-md px-3.5 py-1.5 transition-colors",
            theme === value
              ? "bg-white shadow-xs dark:bg-primary-50 dark:text-neutral-100"
              : "text-neutral-500 hover:bg-neutral-200/60 hover:text-black dark:text-neutral-200 dark:hover:bg-primary-50/60"
          )}
        >
          <Icon className="-ml-1 h-4 w-4" />
          <span className="ml-1.5 text-sm">{label}</span>
        </button>
      ))}
    </div>
  );
}
