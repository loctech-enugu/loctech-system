"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { type NavGroupItem } from "@/types";

export function NavMain({
  items = [],
  title = "Platform",
}: {
  items: NavGroupItem[];
  title?: string;
}) {
  const pathname = usePathname();
  const { data } = useSession();
  const userRole = data?.user?.role;

  const filteredItems = items.filter((item) => {
    if (item.isAdmin) {
      return userRole === "admin" || userRole === "super_admin";
    }
    return true;
  });

  return (
    <SidebarGroup className="px-2 py-0">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {filteredItems.map((item) => {
          const hasSubItems = item.items && item.items.length > 0;
          const filteredSubItems = hasSubItems
            ? item.items!.filter((sub) =>
                sub.isAdmin ? userRole === "admin" || userRole === "super_admin" : true
              )
            : [];

          if (hasSubItems && filteredSubItems.length > 0) {
            const isActive = filteredSubItems.some((sub) => pathname?.startsWith(sub.href));
            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {filteredSubItems.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild isActive={pathname?.startsWith(subItem.href)}>
                            <Link href={subItem.href} prefetch>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          }

          if (item.href) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={
                    item.href === "/dashboard"
                      ? pathname === item.href
                      : pathname?.startsWith(item.href)
                  }
                  tooltip={item.title}
                >
                  <Link href={item.href} prefetch>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return null;
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
