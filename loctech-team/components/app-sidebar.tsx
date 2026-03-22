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
import { type NavGroupItem } from "@/types";
import {
  CalendarCheck,
  Folder,
  Globe,
  LayoutGrid,
  Mic,
  QrCode,
  GraduationCap,
  ClipboardList,
  MessageSquare,
  FileText,
} from "lucide-react";
import AppLogo from "./app-logo";
import Link from "next/link";
import { userLinks } from "@/lib/utils";
import { useSession } from "next-auth/react";

const getMainNavItems = (userRole?: string): NavGroupItem[] => {
  const items: NavGroupItem[] = [
    {
      title: "Dashboard",
      href: userLinks.dashboard,
      icon: LayoutGrid,
    },
    {
      title: "Academy",
      icon: GraduationCap,
      isActive: false,
      items: [
        { title: "Courses", href: userLinks.courses },
        { title: "Classes", href: userLinks.classes },
        ...(userRole === "admin" || userRole === "super_admin"
          ? [
            { title: "Students", href: userLinks.students, isAdmin: true },
            { title: "Staff", href: userLinks.users, isAdmin: true },
          ]
          : []),
      ],
    },
    {
      title: "Attendance",
      icon: CalendarCheck,
      items: [
        { title: "Sign In", href: userLinks.signIn },
        ...(userRole === "admin" || userRole === "super_admin"
          ? [
            { title: "Staff Attendance", href: userLinks.attendance.staff, isAdmin: true },
            { title: "Monitoring", href: userLinks.attendance.monitoring, isAdmin: true },
            { title: "Walk-in Front Desk", href: userLinks.walkIn, isAdmin: true },
          ]
          : []),
      ],
    },
    ...(userRole === "admin" || userRole === "super_admin"
      ? [
        {
          title: "CBT",
          icon: ClipboardList,
          isAdmin: true,
          items: [
            { title: "Exams", href: userLinks.cbt.exams, isAdmin: true },
            { title: "Question Bank", href: userLinks.cbt.questions, isAdmin: true },
            { title: "Categories", href: userLinks.cbt.categories, isAdmin: true },
          ],
        } as NavGroupItem,
      ]
      : []),
    {
      title: "Reports",
      href: userLinks.reports,
      icon: Folder,
    },
    {
      title: "Announcements",
      href: userLinks.announcements,
      icon: Mic,
    },
    ...(userRole === "admin" || userRole === "super_admin"
      ? [
        {
          title: "Inquiries",
          href: userLinks.inquiries,
          icon: MessageSquare,
          isAdmin: true,
        } as NavGroupItem,
      ]
      : []),
    ...(userRole === "super_admin"
      ? [
        {
          title: "Audit Logs",
          href: userLinks.auditLogs,
          icon: FileText,
          isAdmin: true,
        } as NavGroupItem,
      ]
      : []),
  ];

  return items;
};

const footerNavItems = [
  { title: "Website", href: "https://loctech.com", icon: Globe },
  { title: "QR Code", href: "/admin/qr", icon: QrCode, isAdmin: true },
];

export function AppSidebar() {
  const { data: session } = useSession();
  const userRole = session?.user?.role;
  const mainNavItems = getMainNavItems(userRole);

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
        <NavMain items={mainNavItems} title="Platform" />
      </SidebarContent>

      <SidebarFooter>
        <NavFooter
          items={footerNavItems.map((i) => ({
            ...i,
            isAdmin: "isAdmin" in i ? i.isAdmin : undefined,
          }))}
          className="mt-auto"
        />
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  );
}
