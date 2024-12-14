import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codefast/ui';
import Link from 'next/link';
import { type JSX } from 'react';

import { type NavItem } from '@/app/blocks/sidebar-15/_lib/mocks/data';

type NavSecondaryProps = React.ComponentPropsWithoutRef<typeof SidebarGroup> & {
  items: NavItem[];
};

export function NavSecondary({ items, ...props }: NavSecondaryProps): JSX.Element {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
              {item.badge ? <SidebarMenuBadge>{item.badge}</SidebarMenuBadge> : null}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
