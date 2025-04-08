import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, JSX } from 'react';

import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@codefast/ui';
import Link from 'next/link';

export function NavSecondary({
  items,
  ...props
}: ComponentProps<typeof SidebarGroup> & { items: { icon: LucideIcon; title: string; url: string }[] }): JSX.Element {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
