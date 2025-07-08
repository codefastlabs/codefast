"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@codefast/ui";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import type { LucideIcon } from "lucide-react";
import type { JSX } from "react";

export function NavMain({
  items,
}: {
  items: {
    icon: LucideIcon;
    title: string;
    url: string;
    disabled?: boolean;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}): JSX.Element {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible asChild defaultOpen={item.isActive} key={item.title}>
            <SidebarMenuItem>
              <SidebarMenuButton asChild disabled={item.disabled} isActive={pathname === item.url} tooltip={item.title}>
                {item.disabled ? (
                  <span className="data-[disabled=true]:opacity-50" data-disabled={item.disabled}>
                    <item.icon className="text-muted-foreground" />
                    <span>{item.title}</span>
                  </span>
                ) : (
                  <Link className="data-[disabled=true]:opacity-50" data-disabled={item.disabled} href={item.url}>
                    <item.icon className="text-muted-foreground" />
                    <span>{item.title}</span>
                  </Link>
                )}
              </SidebarMenuButton>
              {item.items?.length ? (
                <>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuAction className="data-[state=open]:rotate-90">
                      <ChevronRight />
                      <span className="sr-only">Toggle</span>
                    </SidebarMenuAction>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </>
              ) : null}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
