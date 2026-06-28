import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@codefast/ui/sidebar";
import { toast, Toaster } from "@codefast/ui/sonner";
import { FrameIcon, MapIcon, PieChartIcon, PlusIcon } from "lucide-react";

export function SidebarGroupActionExample() {
  return (
    <SidebarProvider className="h-96 min-h-0 w-full overflow-hidden rounded-xl border [contain:layout] [&_[data-slot=sidebar-container]]:h-full">
      <Toaster
        position="bottom-left"
        toastOptions={{
          className: "ms-40",
        }}
      />
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupAction title="Add Project" onClick={() => toast("You clicked the group action!")}>
              <PlusIcon /> <span className="sr-only">Add Project</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/">
                      <FrameIcon />
                      <span>Design Engineering</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/">
                      <PieChartIcon />
                      <span>Sales & Marketing</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <a href="/">
                      <MapIcon />
                      <span>Travel</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
