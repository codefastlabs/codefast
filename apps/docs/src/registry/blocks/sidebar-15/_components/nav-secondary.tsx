import type { LucideIcon } from "lucide-react";
import type { ComponentProps, JSX, ReactNode } from "react";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@codefast/ui";
import Link from "next/link";

export function NavSecondary({
  items,
  ...props
}: ComponentProps<typeof SidebarGroup> & {
  items: { icon: LucideIcon; title: string; url: string; badge?: ReactNode }[];
}): JSX.Element {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
