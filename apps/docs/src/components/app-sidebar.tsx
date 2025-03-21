'use client';

import type { ComponentProps, JSX } from 'react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Label,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@codefast/ui';
import {
  AudioWaveformIcon,
  BookOpenIcon,
  BotIcon,
  ChevronRightIcon,
  CommandIcon,
  GalleryVerticalEndIcon,
  SearchIcon,
  Settings2Icon,
  SquareTerminalIcon,
} from 'lucide-react';
import Link from 'next/link';

import type { Registry } from '@/types/registry';
import type { NavItem, Team, User } from '@/types/sidebar';

import { registryComponents } from '@/app/(app)/components/registry-components';
import { NavUser } from '@/registry/blocks/sidebar-07/components/nav-user';
import { TeamSwitcher } from '@/registry/blocks/sidebar-07/components/team-switcher';

// This is sample data.
const data: {
  components: Registry[];
  navMain: NavItem[];
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
  components: Object.values(registryComponents),
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent>
            <form className="relative">
              <Label className="sr-only" htmlFor="search">
                Search
              </Label>
              <SidebarInput className="pl-8" id="search" placeholder="Search the docs..." />
              <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
            </form>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <Collapsible key={item.title} asChild className="group/collapsible" defaultOpen={item.isActive}>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={item.title}>
                      {item.icon ? <item.icon /> : null}

                      <span>{item.title}</span>
                      <ChevronRightIcon className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
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
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup>
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>Components</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/components">All Components</Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {data.components.map((item) => (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton asChild>
                  <Link href={`/components/${item.name}`}>{item.title}</Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
