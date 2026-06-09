import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@codefast/ui/sidebar";
import { BellIcon, InboxIcon, MessageSquareIcon } from "lucide-react";

const NAV = [
  { title: "Inbox", icon: InboxIcon, count: 12, active: true },
  { title: "Messages", icon: MessageSquareIcon, count: 3, active: false },
  { title: "Notifications", icon: BellIcon, count: 0, active: false },
];

export function SidebarBadges() {
  return (
    <SidebarProvider className="h-72 min-h-0 w-full max-w-sm overflow-hidden rounded-xl border [contain:layout]">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Activity</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ title, icon: Icon, count, active }) => (
                  <SidebarMenuItem key={title}>
                    <SidebarMenuButton isActive={active}>
                      <Icon />
                      <span>{title}</span>
                    </SidebarMenuButton>
                    {count > 0 ? <SidebarMenuBadge>{count}</SidebarMenuBadge> : null}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
      <main className="flex flex-1 items-start p-4">
        <SidebarTrigger />
      </main>
    </SidebarProvider>
  );
}
