"use client";
import { NavFooter } from "@/components/nav-footer";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { type NavItem } from "@/types";
import {
  BookA,
  CalendarCheck,
  CalendarDays,
  Folder,
  Globe,
  LayoutGrid,
  List,
  Mic,
  QrCode,
  Users,
  GraduationCap,
  UserCheck,
  FileQuestion,
  ClipboardList,
  AlertTriangle,
  School,
  UserCog,
} from "lucide-react";
import AppLogo from "./app-logo";
import Link from "next/link";
import { userLinks } from "@/lib/utils";
import { useSession } from "next-auth/react";

// Base navigation items (shown to all authenticated users)
const getMainNavItems = (userRole?: string): NavItem[] => {
  const baseItems: NavItem[] = [
    {
      title: "Dashboard",
      href: userLinks.dashboard,
      icon: LayoutGrid,
    },
  ];

  // Role-specific dashboard links
  if (userRole === "instructor") {
    baseItems.push({
      title: "Instructor Dashboard",
      href: userLinks.instructor.dashboard,
      icon: UserCog,
    });
  }

  if (userRole === "student") {
    baseItems.push({
      title: "My Dashboard",
      href: userLinks.student.dashboard,
      icon: LayoutGrid,
    });
  }

  // Common items
  baseItems.push(
    {
      title: "Sign In",
      href: userLinks.signIn,
      icon: CalendarCheck,
    },
    {
      title: "Reports",
      href: userLinks.reports,
      icon: Folder,
    },
    {
      title: "Announcement",
      href: userLinks.announcements,
      icon: Mic,
    }
  );

  // Admin/Staff items
  if (userRole === "admin" || userRole === "super_admin" || userRole === "staff") {
    baseItems.push(
      {
        title: "Staff",
        href: userLinks.users,
        icon: Users,
        isAdmin: true,
      },
      {
        title: "Students",
        href: userLinks.students,
        icon: List,
        isAdmin: true,
      },
      {
        title: "Courses",
        href: userLinks.courses,
        icon: BookA,
      },
      {
        title: "Classes",
        href: userLinks.classes,
        icon: GraduationCap,
        isAdmin: true,
      }
    );
  } else if (userRole === "instructor") {
    baseItems.push({
      title: "Courses",
      href: userLinks.courses,
      icon: BookA,
    });
  } else {
    baseItems.push({
      title: "Courses",
      href: userLinks.courses,
      icon: BookA,
    });
  }

  return baseItems;
};

const getMidNavItems = (userRole?: string): NavItem[] => {
  const items: NavItem[] = [];

  if (userRole === "admin" || userRole === "super_admin" || userRole === "staff") {
    items.push(
      {
        title: "Staff Attendance",
        href: userLinks.attendance.staff,
        icon: CalendarDays,
        isAdmin: true,
      },
      {
        title: "Attendance Monitoring",
        href: userLinks.attendance.monitoring,
        icon: AlertTriangle,
        isAdmin: true,
      }
    );
  }

  return items;
};

const getCbtNavItems = (userRole?: string): NavItem[] => {
  const items: NavItem[] = [];

  if (userRole === "admin" || userRole === "super_admin") {
    items.push(
      {
        title: "Exams",
        href: userLinks.cbt.exams,
        icon: ClipboardList,
        isAdmin: true,
      },
      {
        title: "Question Bank",
        href: userLinks.cbt.questions,
        icon: FileQuestion,
        isAdmin: true,
      }
    );
  }

  return items;
};

const getStudentNavItems = (userRole?: string): NavItem[] => {
  if (userRole === "student") {
    return [
      {
        title: "My Exams",
        href: userLinks.student.exams,
        icon: ClipboardList,
      },
      {
        title: "Sign In Attendance",
        href: userLinks.student.attendance,
        icon: CalendarCheck,
      },
    ];
  }
  return [];
};

const footerNavItems: NavItem[] = [
  {
    title: "Website",
    href: "https://loctech.com",
    icon: Globe,
  },
  {
    title: "QR Code",
    href: "/admin/qr",
    icon: QrCode,
    isAdmin: true,
  },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;

  const mainNavItems = getMainNavItems(userRole);
  const midNavItems = getMidNavItems(userRole);
  const cbtNavItems = getCbtNavItems(userRole);
  const studentNavItems = getStudentNavItems(userRole);

  return (
    <Sidebar collapsible="icon" variant="inset">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/dashboard" prefetch>
                <AppLogo />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={mainNavItems} />
        {midNavItems.length > 0 && (
          <NavMain items={midNavItems} title="Attendance" />
        )}
        {cbtNavItems.length > 0 && (
          <NavMain items={cbtNavItems} title="CBT System" />
        )}
        {studentNavItems.length > 0 && (
          <NavMain items={studentNavItems} title="Student Portal" />
        )}
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
