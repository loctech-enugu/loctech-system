import { clsx, type ClassValue } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const authLinks = {
  login: "/auth/login",
  register: "/auth/register",
  forgot_password: "/auth/forgot-password",
  password_reset: "/auth/password/reset",
  complete_registration: "/auth/complete-registration",
  check_mail: "/auth/check-mail",
};
export const userLinks = {
  profile: "/settings/profile",
  appearance: "/settings/appearance",
  password: "/settings/password",
  dashboard: "/dashboard",
  signIn: "/dashboard/sign-in",
  reports: "/dashboard/reports",
  users: "/dashboard/users",
  students: "/dashboard/students",
  courses: "/dashboard/courses",
  schedule: (courseId: string) => `/dashboard/courses/${courseId}/schedule`,
  scholarship: "/dashboard/scholarship-students",
  attendance: {
    staff: "/dashboard/attendance/staff",
    students: (courseId: string) =>
      `/dashboard/attendance/${courseId}/students`,
  },
  settings: "/dashboard/settings",
  notifications: "/dashboard/notifications",
  billing: "/dashboard/billing",
  plans: "/dashboard/plans",
  api: "/dashboard/api",
  logs: "/dashboard/logs",
};

export const getGreeting = (name: string) => {
  const nowTime = new Date();
  const hour = nowTime.getHours(),
    firstName = extractFirstName(name);

  //   console.log(nowTime);
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
  // Split the name by spaces
  const nameParts = name.split(" ");

  // Define an array of titles
  const titles = ["Prof.", "Mr.", "Mrs.", "Dr.", "Ms.", "Miss", "Sir", "Madam"];

  // Loop through each part of the name
  for (const part of nameParts) {
    // If the part is not a title, return it as the first name
    if (!titles.includes(part)) {
      return part;
    }
  }

  // If no name part is found, return an empty string
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
