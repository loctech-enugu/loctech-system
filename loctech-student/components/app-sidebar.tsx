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
  LayoutGrid,
  ClipboardList,
  CalendarCheck,
  Mic,
  Globe,
} from "lucide-react";
import AppLogo from "./app-logo";
import Link from "next/link";
import { userLinks } from "@/lib/utils";

// Student-only navigation items
const getStudentNavItems = (): NavItem[] => {
  return [
    {
      title: "Dashboard",
      href: userLinks.dashboard,
      icon: LayoutGrid,
    },
    {
      title: "My Exams",
      href: userLinks.exams,
      icon: ClipboardList,
    },
    {
      title: "Sign In Attendance",
      href: userLinks.attendance,
      icon: CalendarCheck,
    },
    {
      title: "Announcements",
      href: userLinks.announcements,
      icon: Mic,
    },
  ];
};

const footerNavItems: NavItem[] = [
  {
    title: "Website",
    href: "https://loctech.com",
    icon: Globe,
  },
];

export function AppSidebar() {
  const studentNavItems = getStudentNavItems();

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
        <NavMain items={studentNavItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter items={footerNavItems} className="mt-auto" />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
