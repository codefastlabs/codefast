import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@codefast/ui/sidebar";
import { HomeIcon, InboxIcon, SearchIcon, SettingsIcon, UserIcon } from "lucide-react";

const NAV = [
  { title: "Home", icon: HomeIcon },
  { title: "Inbox", icon: InboxIcon },
  { title: "Search", icon: SearchIcon },
  { title: "Profile", icon: UserIcon },
  { title: "Settings", icon: SettingsIcon },
];

export function SidebarAppShell() {
  return (
    <SidebarProvider className="h-72 w-full max-w-sm overflow-hidden rounded-xl border">
      <Sidebar>
        <SidebarHeader className="px-4 py-3 text-sm font-semibold">My App</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {NAV.map(({ title, icon: Icon }) => (
                  <SidebarMenuItem key={title}>
                    <SidebarMenuButton>
                      <Icon />
                      <span>{title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter className="px-4 py-3 text-xs text-ui-muted">v1.0.0</SidebarFooter>
      </Sidebar>
      <main className="flex flex-1 flex-col gap-2 p-4">
        <SidebarTrigger />
        <p className="text-sm text-ui-muted">Main content — toggle the rail with the trigger.</p>
      </main>
    </SidebarProvider>
  );
}
