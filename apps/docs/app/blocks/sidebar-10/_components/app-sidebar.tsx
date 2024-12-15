import type { ComponentProps, JSX } from 'react';

import { cn, Sidebar, SidebarContent, SidebarHeader, SidebarRail } from '@codefast/ui';

import { NavFavorites } from '@/app/blocks/sidebar-10/_components/nav-favorites';
import { NavMain } from '@/app/blocks/sidebar-10/_components/nav-main';
import { NavSecondary } from '@/app/blocks/sidebar-10/_components/nav-secondary';
import { NavWorkspaces } from '@/app/blocks/sidebar-10/_components/nav-workspaces';
import { TeamSwitcher } from '@/app/blocks/sidebar-10/_components/team-switcher';
import { data } from '@/app/blocks/sidebar-10/_lib/mocks/data';

type AppSidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebar({ className, ...props }: AppSidebarProps): JSX.Element {
  return (
    <Sidebar className={cn('border-r-0', className)} {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
        <NavMain items={data.navMain} />
      </SidebarHeader>
      <SidebarContent>
        <NavFavorites favorites={data.favorites} />
        <NavWorkspaces workspaces={data.workspaces} />
        <NavSecondary className="mt-auto" items={data.navSecondary} />
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
