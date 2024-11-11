import { cn, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@codefast/ui';
import { type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { type ComponentProps, type JSX } from 'react';

interface NavMainProps extends ComponentProps<typeof SidebarMenu> {
  items: {
    icon: LucideIcon;
    title: string;
    url: string;
    isActive?: boolean;
  }[];
}

export function NavMain({ items, className, ...props }: NavMainProps): JSX.Element {
  return (
    <SidebarMenu className={cn('', className)} {...props}>
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
