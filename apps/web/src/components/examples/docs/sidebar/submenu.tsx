import {
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
  SidebarProvider,
  SidebarTrigger,
} from "@codefast/ui/sidebar";
import { FolderIcon, LayoutDashboardIcon } from "lucide-react";

const PROJECTS = ["Website", "Mobile app", "Design system"];

export function SidebarSubmenu() {
  return (
    <SidebarProvider className="h-72 w-full max-w-sm overflow-hidden rounded-xl border">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspace</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <LayoutDashboardIcon />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton>
                    <FolderIcon />
                    <span>Projects</span>
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {PROJECTS.map((project, index) => (
                      <SidebarMenuSubItem key={project}>
                        <SidebarMenuSubButton isActive={index === 0}>
                          {project}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
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
