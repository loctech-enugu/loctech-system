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
} from "lucide-react";
import AppLogo from "./app-logo";
import Link from "next/link";
import { userLinks } from "@/lib/utils";

const mainNavItems: NavItem[] = [
  {
    title: "Dashboard",
    href: userLinks.dashboard,
    icon: LayoutGrid,
  },
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
  },
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
  // {
  //   title: "Scholarship Students",
  //   href: userLinks.scholarship,
  //   icon: List,
  //   isAdmin: true,
  // },
  {
    title: "Courses",
    href: userLinks.courses,
    icon: BookA,
  },
];

const midNavItems: NavItem[] = [
  {
    title: "Staff",
    href: userLinks.attendance.staff,
    icon: CalendarDays,
    isAdmin: true,
  },
  // {
  //   title: "Students",
  //   href: userLinks.attendance.students,
  //   icon: CalendarDays,
  //   isAdmin: true,
  // },
];
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
        <NavMain items={midNavItems} title="Attendance" />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
