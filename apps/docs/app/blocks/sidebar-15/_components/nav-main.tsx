import type { JSX } from 'react';

import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@codefast/ui';
import Link from 'next/link';

import type { NavItem } from '@/app/blocks/sidebar-15/_lib/mocks/data';

interface NavMainProps {
  items: NavItem[];
}

export function NavMain({ items }: NavMainProps): JSX.Element {
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
