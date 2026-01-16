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

  const filteredItems = items.filter(
    (item) =>
      item.isAdmin == null || (item.isAdmin && data?.user?.role !== "staff")
  );

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
