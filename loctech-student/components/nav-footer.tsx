"use client";

import { Icon } from "@/components/icon";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { type NavItem } from "@/types";
import { useSession } from "next-auth/react";
import { type ComponentPropsWithoutRef } from "react";

export function NavFooter({
  items,
  className,
  ...props
}: ComponentPropsWithoutRef<typeof SidebarGroup> & {
  items: NavItem[];
}) {
  const { data } = useSession();

  const filteredItems = items.filter(
    (item) =>
      item.isAdmin == null || (item.isAdmin && data?.user?.role !== "staff")
  );

  return (
    <SidebarGroup
      {...props}
      className={`group-data-[collapsible=icon]:p-0 ${className || ""}`}
    >
      <SidebarGroupContent>
        <SidebarMenu>
          {filteredItems.map((item, index) => (
            <SidebarMenuItem key={item.href || `${item.title}-${index}`}>
              <SidebarMenuButton
                asChild
                className="text-neutral-600 hover:text-neutral-800 dark:text-neutral-300 dark:hover:text-neutral-100"
              >
                <a href={item.href} target="_blank" rel="noopener noreferrer">
                  {item.icon && (
                    <Icon iconNode={item.icon} className="h-5 w-5" />
                  )}
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
