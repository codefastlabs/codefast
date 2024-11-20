import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@codefast/ui';
import { CheckIcon, ChevronRightIcon } from '@radix-ui/react-icons';
import { Fragment, type JSX } from 'react';

import { type Calendar } from '@/app/blocks/sidebar-15/_lib/mocks/data';

interface CalendarsProps {
  calendars: Calendar[];
}

export function Calendars({ calendars }: CalendarsProps): JSX.Element {
  return (
    <>
      {calendars.map((calendar, calendarIndex) => (
        <Fragment key={calendar.name}>
          <SidebarGroup key={calendar.name} className="py-0">
            <Collapsible className="group/collapsible" defaultOpen={calendarIndex === 0}>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
              >
                <CollapsibleTrigger>
                  {calendar.name}{' '}
                  <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {calendar.items.map((item, index) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton>
                          <div
                            className="group/calendar-item border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-primary data-[active=true]:bg-sidebar-primary flex aspect-square size-4 shrink-0 items-center justify-center rounded-sm border"
                            data-active={index < 2}
                          >
                            <CheckIcon className="hidden size-3 group-data-[active=true]/calendar-item:block" />
                          </div>
                          {item}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </Collapsible>
          </SidebarGroup>
          <SidebarSeparator className="mx-0" />
        </Fragment>
      ))}
    </>
  );
}
