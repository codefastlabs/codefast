import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
} from "@codefast/ui/sidebar";

const items = [
  {
    title: "Getting Started",
    url: "#",
    items: [
      {
        title: "Installation",
        url: "#",
      },
      {
        title: "Project Structure",
        url: "#",
      },
    ],
  },
  {
    title: "Build Your Application",
    url: "#",
    items: [
      {
        title: "Routing",
        url: "#",
      },
      {
        title: "Data Fetching",
        url: "#",
        isActive: true,
      },
      {
        title: "Rendering",
        url: "#",
      },
      {
        title: "Caching",
        url: "#",
      },
      {
        title: "Styling",
        url: "#",
      },
      {
        title: "Optimizing",
        url: "#",
      },
      {
        title: "Configuring",
        url: "#",
      },
      {
        title: "Testing",
        url: "#",
      },
      {
        title: "Authentication",
        url: "#",
      },
      {
        title: "Deploying",
        url: "#",
      },
      {
        title: "Upgrading",
        url: "#",
      },
      {
        title: "Examples",
        url: "#",
      },
    ],
  },
  {
    title: "API Reference",
    url: "#",
    items: [
      {
        title: "Components",
        url: "#",
      },
      {
        title: "File Conventions",
        url: "#",
      },
      {
        title: "Functions",
        url: "#",
      },
      {
        title: "Config Options",
        url: "#",
      },
      {
        title: "CLI",
        url: "#",
      },
      {
        title: "Edge Runtime",
        url: "#",
      },
    ],
  },
  {
    title: "Architecture",
    url: "#",
    items: [
      {
        title: "Accessibility",
        url: "#",
      },
      {
        title: "Fast Refresh",
        url: "#",
      },
      {
        title: "Build Tooling",
        url: "#",
      },
      {
        title: "Supported Browsers",
        url: "#",
      },
      {
        title: "Vite",
        url: "#",
      },
    ],
  },
];

export function SidebarMenuSubExample() {
  return (
    <SidebarProvider className="h-96 min-h-0 w-full overflow-hidden rounded-xl border [contain:layout] [&_[data-slot=sidebar-container]]:h-full">
      <Sidebar>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton asChild>
                      <a href={item.url}>
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                    <SidebarMenuSub>
                      {item.items.map((subItem, subIndex) => (
                        <SidebarMenuSubItem key={subIndex}>
                          <SidebarMenuSubButton asChild>
                            <a href={subItem.url}>
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    </SidebarProvider>
  );
}
