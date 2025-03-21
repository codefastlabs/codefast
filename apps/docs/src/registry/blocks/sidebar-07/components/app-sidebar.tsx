'use client';

import type { ComponentProps, JSX } from 'react';

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from '@codefast/ui';
import {
  AudioWaveformIcon,
  BookOpenIcon,
  BotIcon,
  CommandIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  MapIcon,
  PieChartIcon,
  Settings2Icon,
  SquareTerminalIcon,
} from 'lucide-react';

import type { NavItem, Project, Team, User } from '@/types/sidebar';

import { NavMain } from '@/registry/blocks/sidebar-07/components/nav-main';
import { NavProjects } from '@/registry/blocks/sidebar-07/components/nav-projects';
import { NavUser } from '@/registry/blocks/sidebar-07/components/nav-user';
import { TeamSwitcher } from '@/registry/blocks/sidebar-07/components/team-switcher';

// This is sample data.
const data: {
  navMain: NavItem[];
  projects: Project[];
  teams: Team[];
  user: User;
} = {
  user: { name: '@codefast/ui', email: 'm@example.com', avatar: '/avatars/codefast-ui.webp' },
  teams: [
    { name: 'Acme Inc', logo: GalleryVerticalEndIcon, plan: 'Enterprise' },
    { name: 'Acme Corp.', logo: AudioWaveformIcon, plan: 'Startup' },
    { name: 'Evil Corp.', logo: CommandIcon, plan: 'Free' },
  ],
  navMain: [
    {
      title: 'Playground',
      url: '#',
      icon: SquareTerminalIcon,
      isActive: true,
      items: [
        { title: 'History', url: '#' },
        { title: 'Starred', url: '#' },
        { title: 'Settings', url: '#' },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: BotIcon,
      items: [
        { title: 'Genesis', url: '#' },
        { title: 'Explorer', url: '#' },
        { title: 'Quantum', url: '#' },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: BookOpenIcon,
      items: [
        { title: 'Introduction', url: '#' },
        { title: 'Get Started', url: '#' },
        { title: 'Tutorials', url: '#' },
        { title: 'Changelog', url: '#' },
      ],
    },
    {
      title: 'Settings',
      url: '#',
      icon: Settings2Icon,
      items: [
        { title: 'General', url: '#' },
        { title: 'Team', url: '#' },
        { title: 'Billing', url: '#' },
        { title: 'Limits', url: '#' },
      ],
    },
  ],
  projects: [
    { name: 'Design Engineering', url: '#', icon: FrameIcon },
    { name: 'Sales & Marketing', url: '#', icon: PieChartIcon },
    { name: 'Travel', url: '#', icon: MapIcon },
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
