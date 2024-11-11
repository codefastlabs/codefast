import {
  cn,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codefast/ui';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { type ComponentProps, type JSX } from 'react';

interface NavSecondaryProps extends ComponentProps<typeof SidebarGroup> {
  items: {
    icon: LucideIcon;
    title: string;
    url: string;
    badge?: React.ReactNode;
  }[];
}

export function NavSecondary({ items, className, ...props }: NavSecondaryProps): JSX.Element {
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
