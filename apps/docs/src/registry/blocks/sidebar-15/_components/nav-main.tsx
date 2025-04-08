'use client';

import type { LucideIcon } from 'lucide-react';
import type { JSX } from 'react';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@codefast/ui';
import Link from 'next/link';

export function NavMain({
  items,
}: {
  items: { icon: LucideIcon; title: string; url: string; isActive?: boolean }[];
}): JSX.Element {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.title}>
          <SidebarMenuButton asChild isActive={item.isActive}>
            <Link href={item.url}>
              <item.icon />
              <span>{item.title}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
