import {
  cn,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@codefast/ui';
import { PlusIcon } from '@radix-ui/react-icons';
import { type ComponentProps, type JSX } from 'react';

import { Calendars } from '@/app/blocks/sidebar-15/_components/calendars';
import { DatePicker } from '@/app/blocks/sidebar-15/_components/date-picker';
import { NavUser } from '@/app/blocks/sidebar-15/_components/nav-user';
import { sidebarRightData } from '@/app/blocks/sidebar-15/_lib/mocks/data';

type SidebarRightProps = ComponentProps<typeof Sidebar>;

export function SidebarRight({ className, ...props }: SidebarRightProps): JSX.Element {
  return (
    <Sidebar className={cn('sticky top-0 hidden h-svh border-l lg:flex', className)} collapsible="none" {...props}>
      <SidebarHeader className="border-sidebar-border h-16 border-b">
        <NavUser user={sidebarRightData.user} />
      </SidebarHeader>
      <SidebarContent>
        <DatePicker />
        <SidebarSeparator className="mx-0" />
        <Calendars calendars={sidebarRightData.calendars} />
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
    </Sidebar>
  );
}
