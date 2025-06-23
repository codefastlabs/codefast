"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@codefast/ui";
import type { LucideIcon } from "lucide-react";
import { MoreHorizontalIcon } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

export function NavMain({
  items,
}: {
  items: {
    items: { title: string; url: string; isActive?: boolean }[];
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
}): JSX.Element {
  const { isMobile } = useSidebar("NavMain");

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <DropdownMenu key={item.title}>
            <SidebarMenuItem>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  {item.title} <MoreHorizontalIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {item.items.length > 0 ? (
                <DropdownMenuContent
                  align={isMobile ? "end" : "start"}
                  className="min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                >
                  {item.items.map((navItem) => (
                    <DropdownMenuItem key={navItem.title} asChild>
                      <Link href={navItem.url}>{navItem.title}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              ) : null}
            </SidebarMenuItem>
          </DropdownMenu>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
