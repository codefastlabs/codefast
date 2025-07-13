"use client";

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
import type { ComponentProps, ComponentType, JSX } from "react";

import { NavMain } from "@/registry/blocks/sidebar-07/_components/nav-main";
import { NavProjects } from "@/registry/blocks/sidebar-07/_components/nav-projects";
import { NavUser } from "@/registry/blocks/sidebar-07/_components/nav-user";
import { TeamSwitcher } from "@/registry/blocks/sidebar-07/_components/team-switcher";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "@codefast/ui";

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
  projects: [
    { icon: FrameIcon, name: "Design Engineering", url: "#" },
    { icon: PieChartIcon, name: "Sales & Marketing", url: "#" },
    { icon: MapIcon, name: "Travel", url: "#" },
  ],
  teams: [
    { logo: GalleryVerticalEndIcon, name: "Acme Inc", plan: "Enterprise" },
    { logo: AudioWaveformIcon, name: "Acme Corp.", plan: "Startup" },
    { logo: CommandIcon, name: "Evil Corp.", plan: "Free" },
  ],
  user: { avatar: "/avatars/codefast-ui.webp", email: "m@example.com", name: "@codefast/ui" },
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
