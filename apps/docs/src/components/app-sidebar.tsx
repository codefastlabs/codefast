'use client';

import type { ComponentProps, JSX } from 'react';

import {
  ScrollArea,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codefast/ui';
import { CommandIcon } from 'lucide-react';
import Link from 'next/link';

import type { NavItemProps } from '@/components/nav-main';

import { registryComponentGroups } from '@/app/(app)/components/registry-components';
import { NavMain } from '@/components/nav-main';
import { registryBlockGroups } from '@/registry/registry-blocks';

const data: {
  navMain: NavItemProps[];
} = {
  navMain: [
    {
      title: 'Components',
      path: '/components',
      groups: registryComponentGroups.map((group) => ({
        ...group,
        components: group.components?.sort((a, b) => a.title.localeCompare(b.title)),
      })),
    },
    {
      title: 'Blocks',
      path: '/blocks',
      groups: registryBlockGroups.map((group) => ({
        ...group,
        components: group.components?.sort((a, b) => a.title.localeCompare(b.title)),
      })),
    },
  ],
};

function LogoButton(): JSX.Element {
  return (
    <SidebarMenuButton asChild size="lg">
      <Link href="#">
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

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar {...props}>
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
