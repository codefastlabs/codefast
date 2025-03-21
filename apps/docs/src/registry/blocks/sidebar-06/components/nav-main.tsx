'use client';

import type { JSX } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@codefast/ui';
import { MoreHorizontalIcon } from 'lucide-react';
import Link from 'next/link';

import type { NavItem } from '@/types/sidebar';

export function NavMain({ items }: { items: NavItem[] }): JSX.Element {
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup>
      <SidebarMenu>
        {items.map((item) => (
          <DropdownMenu key={item.title}>
            <SidebarMenuItem>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  {item.title} <MoreHorizontalIcon className="ml-auto" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              {item.items.length > 0 ? (
                <DropdownMenuContent
                  align={isMobile ? 'end' : 'start'}
                  className="min-w-56 rounded-lg"
                  side={isMobile ? 'bottom' : 'right'}
                >
                  {item.items.map((navItem) => (
                    <DropdownMenuItem key={navItem.title} asChild>
                      <Link href={navItem.url}>{navItem.title}</Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              ) : null}
            </SidebarMenuItem>
          </DropdownMenu>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
