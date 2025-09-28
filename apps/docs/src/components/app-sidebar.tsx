"use client";

import type { ComponentProps, JSX } from "react";

import { CommandIcon } from "lucide-react";
import Link from "next/link";

import type { NavItemProps } from "@/components/nav-main";

import { registryComponentGroups } from "@/app/(app)/components/registry-components";
import { NavMain } from "@/components/nav-main";
import { registryBlockGroups } from "@/registry/registry-blocks";
import { cn } from "@codefast/tailwind-variants";
import {
  ScrollArea,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@codefast/ui";

const data: {
  navMain: NavItemProps[];
} = {
  navMain: [
    {
      groups: registryComponentGroups.map((group) => ({
        ...group,
        components: group.components?.toSorted((a, b) => a.title.localeCompare(b.title)),
      })),
      path: "/components",
      title: "Components",
    },
    {
      groups: registryBlockGroups.map((group) => ({
        ...group,
        components: group.components?.toSorted((a, b) => a.title.localeCompare(b.title)),
      })),
      path: "/blocks",
      title: "Blocks",
    },
  ],
};

function LogoButton(): JSX.Element {
  return (
    <SidebarMenuButton asChild size="lg">
      <Link href="/">
        <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
          <CommandIcon className="size-4" />
        </div>
        <div className="grid flex-1 text-left text-sm leading-tight">
          <span className="truncate font-medium">@codefast/ui</span>
          <span className="truncate text-xs">CodeFast Labs</span>
        </div>
      </Link>
    </SidebarMenuButton>
  );
}

export function AppSidebar({ className, ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar className={cn("z-30", className)} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <LogoButton />
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <ScrollArea className="*:*:block! h-full">
          <NavMain items={data.navMain} />
        </ScrollArea>
      </SidebarContent>
    </Sidebar>
  );
}
