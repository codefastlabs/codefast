"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { JSX } from "react";

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@codefast/ui";

export function NavMain({
  items,
}: {
  items: { icon: LucideIcon; title: string; url: string; isActive?: boolean }[];
}): JSX.Element {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
