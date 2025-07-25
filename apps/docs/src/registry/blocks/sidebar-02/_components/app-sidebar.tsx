import type { LucideIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";

import { SearchForm } from "@/registry/blocks/sidebar-02/_components/search-form";
import { VersionSwitcher } from "@/registry/blocks/sidebar-02/_components/version-switcher";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
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
  versions: string[];
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
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <VersionSwitcher defaultVersion={data.versions[0]} versions={data.versions} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <Collapsible
            key={item.title}
            defaultOpen
            className="group/collapsible"
            title={item.title}
          >
            <SidebarGroup>
              <SidebarGroupLabel
                asChild
                className="group/label text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-sm"
              >
                <CollapsibleTrigger>
                  {item.title}{" "}
                  <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>
              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((navItem) => (
                      <SidebarMenuItem key={navItem.title}>
                        <SidebarMenuButton asChild isActive={navItem.isActive}>
                          <Link href={navItem.url}>{navItem.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
