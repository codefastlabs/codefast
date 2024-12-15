import type { ComponentProps, JSX } from 'react';

import {
  cn,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from '@codefast/ui';
import { PlusIcon } from 'lucide-react';

import { NavUser } from '@/app/blocks/_components/nav-user';
import { Calendars } from '@/app/blocks/sidebar-12/_components/calendars';
import { DatePicker } from '@/app/blocks/sidebar-12/_components/date-picker';
import { data } from '@/app/blocks/sidebar-12/_lib/mocks/data';

type AppSidebarProps = ComponentProps<typeof Sidebar>;

export function AppSidebar({ className, ...props }: AppSidebarProps): JSX.Element {
  return (
    <Sidebar className={cn('', className)} {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={data.user} />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <Calendars calendars={data.calendars} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <PlusIcon />
              <span>New Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
