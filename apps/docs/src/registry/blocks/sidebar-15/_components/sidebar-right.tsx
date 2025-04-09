import type { ComponentProps, JSX } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@codefast/ui";
import { PlusIcon } from "lucide-react";

import { Calendars } from "@/registry/blocks/sidebar-15/_components/calendars";
import { DatePicker } from "@/registry/blocks/sidebar-15/_components/date-picker";
import { NavUser } from "@/registry/blocks/sidebar-15/_components/nav-user";

// This is sample data.
const data = {
  user: { name: "@codefast/ui", email: "m@example.com", avatar: "/avatars/codefast-ui.webp" },
  calendars: [
    {
      name: "My Calendars",
      items: ["Personal", "Work", "Family"],
    },
    {
      name: "Favorites",
      items: ["Holidays", "Birthdays"],
    },
    {
      name: "Other",
      items: ["Travel", "Reminders", "Deadlines"],
    },
  ],
};

export function SidebarRight({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar className="sticky top-0 hidden h-svh border-l lg:flex" collapsible="none" {...props}>
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
    </Sidebar>
  );
}
