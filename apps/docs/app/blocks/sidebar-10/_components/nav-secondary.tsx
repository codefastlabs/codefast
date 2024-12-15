import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, JSX } from 'react';

import {
  cn,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codefast/ui';
import Link from 'next/link';

interface NavSecondaryProps extends ComponentProps<typeof SidebarGroup> {
  items: {
    icon: LucideIcon;
    title: string;
    url: string;
    badge?: React.ReactNode;
  }[];
}

export function NavSecondary({ className, items, ...props }: NavSecondaryProps): JSX.Element {
  return (
    <SidebarGroup className={cn('', className)} {...props}>
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
