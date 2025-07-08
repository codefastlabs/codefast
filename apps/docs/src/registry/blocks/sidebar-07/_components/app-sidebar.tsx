"use client";

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@codefast/ui";
import {
  AudioWaveformIcon,
  BookOpenIcon,
  BotIcon,
  CommandIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  type LucideIcon,
  MapIcon,
  PieChartIcon,
  Settings2Icon,
  SquareTerminalIcon,
} from "lucide-react";

import { NavMain } from "@/registry/blocks/sidebar-07/_components/nav-main";
import { NavProjects } from "@/registry/blocks/sidebar-07/_components/nav-projects";
import { NavUser } from "@/registry/blocks/sidebar-07/_components/nav-user";
import { TeamSwitcher } from "@/registry/blocks/sidebar-07/_components/team-switcher";

import type { ComponentProps, ComponentType, JSX } from "react";

// This is sample data.
const data: {
  navMain: {
    items: { title: string; url: string; isActive?: boolean }[];
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
  projects: {
    icon: LucideIcon;
    name: string;
    url: string;
  }[];
  teams: {
    logo: ComponentType;
    name: string;
    plan: "Enterprise" | "Free" | "Startup";
  }[];
  user: {
    avatar: string;
    email: string;
    name: string;
  };
} = {
  user: { name: "@codefast/ui", email: "m@example.com", avatar: "/avatars/codefast-ui.webp" },
  teams: [
    { name: "Acme Inc", logo: GalleryVerticalEndIcon, plan: "Enterprise" },
    { name: "Acme Corp.", logo: AudioWaveformIcon, plan: "Startup" },
    { name: "Evil Corp.", logo: CommandIcon, plan: "Free" },
  ],
  navMain: [
    {
      title: "Playground",
      url: "#",
      icon: SquareTerminalIcon,
      isActive: true,
      items: [
        { title: "History", url: "#" },
        { title: "Starred", url: "#" },
        { title: "Settings", url: "#" },
      ],
    },
    {
      title: "Models",
      url: "#",
      icon: BotIcon,
      items: [
        { title: "Genesis", url: "#" },
        { title: "Explorer", url: "#" },
        { title: "Quantum", url: "#" },
      ],
    },
    {
      title: "Documentation",
      url: "#",
      icon: BookOpenIcon,
      items: [
        { title: "Introduction", url: "#" },
        { title: "Get Started", url: "#" },
        { title: "Tutorials", url: "#" },
        { title: "Changelog", url: "#" },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2Icon,
      items: [
        { title: "General", url: "#" },
        { title: "Team", url: "#" },
        { title: "Billing", url: "#" },
        { title: "Limits", url: "#" },
      ],
    },
  ],
  projects: [
    { name: "Design Engineering", url: "#", icon: FrameIcon },
    { name: "Sales & Marketing", url: "#", icon: PieChartIcon },
    { name: "Travel", url: "#", icon: MapIcon },
  ],
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
