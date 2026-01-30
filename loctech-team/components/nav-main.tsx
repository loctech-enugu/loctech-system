"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { type NavItem } from "@/types";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavMain({
  items = [],
  title = "Platform",
}: {
  items: NavItem[];
  title?: string;
}) {
  const pathname = usePathname();

  const { data } = useSession();

  const filteredItems = items.filter((item) => {
    const userRole = data?.user?.role;
    
    // If item has isAdmin flag, check role
    if (item.isAdmin !== null && item.isAdmin) {
      return userRole === "admin" || userRole === "super_admin";
    }
    
    // Show all items without isAdmin flag
    if (item.isAdmin == null) {
      return true;
    }
    
    // Hide admin-only items for non-admin users
    return false;
  });

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              asChild
              isActive={
                item.href === "/dashboard"
                  ? pathname === item.href
                  : pathname?.startsWith(item.href)
              }
              tooltip={{ children: item.title }}
            >
              <Link href={item.href} prefetch>
                {item.icon && <item.icon />}
                <span>{item.title}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
