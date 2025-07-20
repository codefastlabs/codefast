import type { LucideIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { GalleryVerticalEndIcon } from "lucide-react";
import Link from "next/link";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@codefast/ui";

// This is sample data.
const data: {
  navMain: {
    items: { title: string; url: string; isActive?: boolean }[];
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
  }[];
} = {
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
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg">
              <Link href="/">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEndIcon className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Documentation</span>
                  <span className="">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="gap-2">
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link className="font-medium" href={item.url}>
                    {item.title}
                  </Link>
                </SidebarMenuButton>
                {item.items.length > 0 ? (
                  <SidebarMenuSub className="ml-0 border-l-0 px-1.5">
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
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
