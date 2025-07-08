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
} from "@codefast/ui";
import { CheckIcon, ChevronRightIcon } from "lucide-react";
import { Fragment } from "react";

import type { JSX } from "react";

export function Calendars({
  calendars,
}: {
  calendars: {
    items: string[];
    name: string;
  }[];
}): JSX.Element {
  return (
    <>
      {calendars.map((calendar, index) => (
        <Fragment key={calendar.name}>
          <SidebarGroup key={calendar.name} className="py-0">
            <Collapsible className="group/collapsible" defaultOpen={index === 0}>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground w-full text-sm"
              >
                <CollapsibleTrigger>
                  {calendar.name}{" "}
                  <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {calendar.items.map((item, itemIndex) => (
                      <SidebarMenuItem key={item}>
                        <SidebarMenuButton>
                          <div
                            className="group/calendar-item border-sidebar-border text-sidebar-primary-foreground data-[active=true]:border-sidebar-primary data-[active=true]:bg-sidebar-primary rounded-xs flex aspect-square size-4 shrink-0 items-center justify-center border"
                            data-active={itemIndex < 2}
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
