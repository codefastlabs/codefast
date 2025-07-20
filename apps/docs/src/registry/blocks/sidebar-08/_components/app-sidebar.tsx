"use client";

import type { ComponentProps, JSX } from "react";

import {
  BookOpenIcon,
  BotIcon,
  CommandIcon,
  FrameIcon,
  LifeBuoyIcon,
  MapIcon,
  PieChartIcon,
  SendIcon,
  Settings2Icon,
  SquareTerminalIcon,
} from "lucide-react";
import Link from "next/link";

import { NavMain } from "@/registry/blocks/sidebar-08/_components/nav-main";
import { NavProjects } from "@/registry/blocks/sidebar-08/_components/nav-projects";
import { NavSecondary } from "@/registry/blocks/sidebar-08/_components/nav-secondary";
import { NavUser } from "@/registry/blocks/sidebar-08/_components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@codefast/ui";

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <CommandIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Acme Inc</span>
                  <span className="truncate text-xs">Enterprise</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
        <NavSecondary className="mt-auto" items={data.navSecondary} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}

const data = {
  navMain: [
    {
      icon: SquareTerminalIcon,
      isActive: true,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" },
      ],
      title: "Playground",
      url: "#",
    },
    {
      icon: BotIcon,
      items: [
        { title: "Genesis", url: "#" },
        { title: "Explorer", url: "#" },
        { title: "Quantum", url: "#" },
      ],
      title: "Models",
      url: "#",
    },
    {
      icon: BookOpenIcon,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" },
      ],
      title: "Documentation",
      url: "#",
    },
    {
      icon: Settings2Icon,
      items: [
        { title: "General", url: "#" },
        { title: "Team", url: "#" },
        { title: "Billing", url: "#" },
        { title: "Limits", url: "#" },
      ],
      title: "Settings",
      url: "#",
    },
  ],
  navSecondary: [
    { icon: LifeBuoyIcon, title: "Support", url: "#" },
    { icon: SendIcon, title: "Feedback", url: "#" },
  ],
  projects: [
    { icon: FrameIcon, name: "Design Engineering", url: "#" },
    { icon: PieChartIcon, name: "Sales & Marketing", url: "#" },
    { icon: MapIcon, name: "Travel", url: "#" },
  ],
  user: { avatar: "/avatars/codefast-ui.webp", email: "m@example.com", name: "@codefast/ui" },
};
