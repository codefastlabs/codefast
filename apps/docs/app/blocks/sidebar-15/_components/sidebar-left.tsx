import { cn, Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@codefast/ui';
import { type ComponentProps, type JSX } from 'react';

import { NavFavorites } from '@/app/blocks/sidebar-15/_components/nav-favorites';
import { NavMain } from '@/app/blocks/sidebar-15/_components/nav-main';
import { NavSecondary } from '@/app/blocks/sidebar-15/_components/nav-secondary';
import { NavWorkspaces } from '@/app/blocks/sidebar-15/_components/nav-workspaces';
import { TeamSwitcher } from '@/app/blocks/sidebar-15/_components/team-switcher';
import { sidebarLeftData } from '@/app/blocks/sidebar-15/_lib/mocks/data';

type SidebarLeftProps = ComponentProps<typeof Sidebar>;

export function SidebarLeft({ className, ...props }: SidebarLeftProps): JSX.Element {
  return (
    <Sidebar className={cn('"border-r-0"', className)} {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarLeftData.teams} />
        <NavMain items={sidebarLeftData.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={sidebarLeftData.favorites} />
        <NavWorkspaces workspaces={sidebarLeftData.workspaces} />
        <NavSecondary className="mt-auto" items={sidebarLeftData.navSecondary} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
