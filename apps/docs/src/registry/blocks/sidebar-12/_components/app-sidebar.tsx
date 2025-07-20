import type { ComponentProps, JSX } from "react";

import { PlusIcon } from "lucide-react";

import { Calendars } from "@/registry/blocks/sidebar-12/_components/calendars";
import { DatePicker } from "@/registry/blocks/sidebar-12/_components/date-picker";
import { NavUser } from "@/registry/blocks/sidebar-12/_components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarSeparator,
} from "@codefast/ui";

// This is sample data.
const data = {
  calendars: [
    {
      items: ["Personal", "Work", "Family"],
      name: "My Calendars",
    },
    {
      items: ["Holidays", "Birthdays"],
      name: "Favorites",
    },
    {
      items: ["Travel", "Reminders", "Deadlines"],
      name: "Other",
    },
  ],
  user: {
    avatar: "/avatars/codefast-ui.webp",
    email: "m@example.com",
    name: "@codefast/ui",
  },
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar {...props}>
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
