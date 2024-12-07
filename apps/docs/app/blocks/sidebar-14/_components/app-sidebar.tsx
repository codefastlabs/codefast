import {
  cn,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@codefast/ui';
import { type ComponentProps, type JSX } from 'react';

import { data } from '@/app/blocks/sidebar-14/_lib/mocks/data';

type AppSidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebar({ className, ...props }: AppSidebarProps): JSX.Element {
  return (
    <Sidebar className={cn('', className)} {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Table of Contents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((nav) => (
                <SidebarMenuItem key={nav.title}>
                  <SidebarMenuButton asChild>
                    <a className="font-medium" href={nav.url}>
                      {nav.title}
                    </a>
                  </SidebarMenuButton>
                  {nav.items.length > 0 ? (
                    <SidebarMenuSub>
                      {nav.items.map((item) => (
                        <SidebarMenuSubItem key={item.title}>
                          <SidebarMenuSubButton asChild isActive={item.isActive}>
                            <a href={item.url}>{item.title}</a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
