import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// API Base URL - points to the team app's API
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const authLinks = {
  login: "/auth/login",
  register: "/auth/register",
  forgot_password: "/auth/forgot-password",
  password_reset: "/auth/password/reset",
  complete_registration: "/auth/complete-registration",
  check_mail: "/auth/check-mail",
};

export const userLinks = {
  profile: "/dashboard/profile",
  dashboard: "/dashboard",
  exams: "/dashboard/exams",
  attendance: "/dashboard/attendance/sign-in",
  announcements: "/dashboard/announcements",
  classes: "/dashboard/classes",
};

export const getGreeting = (name: string) => {
  const nowTime = new Date();
  const hour = nowTime.getHours();
  const firstName = extractFirstName(name);

  if (hour >= 20) {
    return {
      greeting: `Good Night ${firstName}`,
      message: `Have a good night rest.`,
    };
  } else if (hour > 17) {
    return {
      greeting: `Good Evening ${firstName}`,
      message: `Hope you enjoyed your day?`,
    };
  } else if (hour > 11) {
    return {
      greeting: `Good Afternoon ${firstName}`,
      message: `How is your day going?`,
    };
  } else if (hour < 12) {
    return {
      greeting: `Good Morning ${firstName}`,
      message: `How was your night?`,
    };
  }

  return {
    greeting: `Good Day ${firstName}`,
    message: `Hope you are doing great?`,
  };
};

export const extractFirstName = (name: string): string => {
  const nameParts = name.split(" ");
  const titles = ["Prof.", "Mr.", "Mrs.", "Dr.", "Ms.", "Miss", "Sir", "Madam"];

  for (const part of nameParts) {
    if (!titles.includes(part)) {
      return part;
    }
  }

  return "";
};

export const copyToClipboard = (text: string) => {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  } else {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
    document.body.removeChild(textArea);
  }
};

export const goToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
};
