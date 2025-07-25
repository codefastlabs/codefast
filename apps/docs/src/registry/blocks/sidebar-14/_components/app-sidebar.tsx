import type { ComponentProps, JSX } from "react";

import Link from "next/link";

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
  SidebarRail,
} from "@codefast/ui";

// This is sample data.
const data = {
  navMain: [
    {
      items: [
        { title: "Installation", url: "#" },
        { title: "Project Structure", url: "#" },
      ],
      title: "Getting Started",
      url: "#",
    },
    {
      items: [
        { title: "Routing", url: "#" },
        { isActive: true, title: "Data Fetching", url: "#" },
        { title: "Rendering", url: "#" },
        { title: "Caching", url: "#" },
        { title: "Styling", url: "#" },
        { title: "Optimizing", url: "#" },
        { title: "Configuring", url: "#" },
        { title: "Testing", url: "#" },
        { title: "Authentication", url: "#" },
        { title: "Deploying", url: "#" },
        { title: "Upgrading", url: "#" },
        { title: "Examples", url: "#" },
      ],
      title: "Building Your Application",
      url: "#",
    },
    {
      items: [
        { title: "Components", url: "#" },
        { title: "File Conventions", url: "#" },
        { title: "Functions", url: "#" },
        { title: "next.config.js Options", url: "#" },
        { title: "CLI", url: "#" },
        { title: "Edge Runtime", url: "#" },
      ],
      title: "API Reference",
      url: "#",
    },
    {
      items: [
        { title: "Accessibility", url: "#" },
        { title: "Fast Refresh", url: "#" },
        { title: "Next.js Compiler", url: "#" },
        { title: "Supported Browsers", url: "#" },
        { title: "Turbopack", url: "#" },
      ],
      title: "Architecture",
      url: "#",
    },
    { items: [{ title: "Contribution Guide", url: "#" }], title: "Community", url: "#" },
  ],
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Table of Contents</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {data.navMain.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <Link className="font-medium" href={item.url}>
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                  {item.items.length > 0 ? (
                    <SidebarMenuSub>
                      {item.items.map((navItem) => (
                        <SidebarMenuSubItem key={navItem.title}>
                          <SidebarMenuSubButton asChild isActive={navItem.isActive}>
                            <Link href={navItem.url}>{navItem.title}</Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  ) : null}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
