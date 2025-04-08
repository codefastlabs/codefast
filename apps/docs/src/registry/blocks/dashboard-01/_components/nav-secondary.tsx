'use client';

import type { Icon } from '@tabler/icons-react';
import type { ComponentProps, JSX } from 'react';

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@codefast/ui';

export function NavSecondary({
  items,
  ...props
}: ComponentProps<typeof SidebarGroup> & {
  items: {
    icon: Icon;
    title: string;
    url: string;
  }[];
}): JSX.Element {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
