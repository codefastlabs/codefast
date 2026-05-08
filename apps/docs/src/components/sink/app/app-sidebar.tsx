import { cn } from "@codefast/tailwind-variants";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@codefast/ui/collapsible";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@codefast/ui/input-group";
import { Label } from "@codefast/ui/label";
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@codefast/ui/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronRightIcon, HomeIcon, SearchIcon } from "lucide-react";
import { useMemo } from "react";
import type { ComponentProps, JSX, ReactNode } from "react";
import type { NavItem } from "#/components/sink/app/app-sidebar-types";
import type { RegistryType } from "#/components/sink/component-registry";
import {
  REGISTRY_TYPES,
  REGISTRY_TYPE_LABELS,
  componentsByType,
} from "#/components/sink/component-registry";
import { TeamSwitcher } from "#/components/sink/app/team-switcher";
import { NavUser } from "#/components/sink/app/nav-user";
import { appSidebarData } from "#/components/sink/app/app-sidebar-data";

/* -------------------------------------------------------------------------------------------------
 * Constants
 * -------------------------------------------------------------------------------------------------*/

const SINK_PATH_PREFIX = "/sink/";

/* -------------------------------------------------------------------------------------------------
 * Component: SearchForm
 * -------------------------------------------------------------------------------------------------*/

function SearchForm(): JSX.Element {
  return (
    <SidebarGroup className={cn("py-0", "group-data-[collapsible=icon]:hidden")}>
      <SidebarGroupContent>
        <form className="relative">
          <Label htmlFor="search" className="sr-only">
            Search
          </Label>
          <InputGroup className={cn("h-8", "bg-background shadow-none")}>
            <InputGroupInput
              id="search"
              placeholder="Search the docs..."
              className="h-7"
              data-slot="input-group-control"
            />
            <InputGroupAddon>
              <SearchIcon className="text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>
        </form>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: NavHomeSection
 * -------------------------------------------------------------------------------------------------*/

function NavHomeSection(): JSX.Element {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Navigation</SidebarGroupLabel>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton asChild tooltip="Home">
            <Link to="/">
              <HomeIcon />
              <span>Home</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarGroup>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: NavMainSection
 * -------------------------------------------------------------------------------------------------*/

interface NavMainSectionProps {
  items: Array<NavItem>;
}

function NavMainSection({ items }: NavMainSectionProps): JSX.Element {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton tooltip={item.title}>
                  <item.icon />
                  <span>{item.title}</span>
                  <ChevronRightIcon
                    className={cn(
                      "ml-auto",
                      "transition-transform duration-200",
                      "group-data-open/collapsible:rotate-90",
                    )}
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton asChild>
                        <Link to={subItem.url}>
                          <span>{subItem.title}</span>
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: ComponentsSection
 * -------------------------------------------------------------------------------------------------*/

interface ComponentsSectionProps {
  pathname: string;
}

function ComponentsSection({ pathname }: ComponentsSectionProps): JSX.Element {
  const registrySections = useMemo(() => {
    const sections: Array<{
      type: RegistryType;
      components: Array<[string, { name: string; href: string; label?: string }]>;
    }> = [];

    for (const type of REGISTRY_TYPES) {
      const components = componentsByType[type];

      if (components.length > 0) {
        sections.push({ type, components });
      }
    }

    return sections;
  }, []);

  const isSinkActive = pathname.includes(SINK_PATH_PREFIX);

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Components</SidebarGroupLabel>
      <SidebarMenu>
        {registrySections.map(({ type, components }) => (
          <Collapsible key={type} asChild defaultOpen={isSinkActive} className="group/collapsible">
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton>
                  <span>{REGISTRY_TYPE_LABELS[type]}</span>
                  <ChevronRightIcon
                    className={cn(
                      "ml-auto",
                      "transition-transform duration-200",
                      "group-data-open/collapsible:rotate-90",
                    )}
                  />
                </SidebarMenuButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <SidebarMenuSub>
                  {components.map(([key, item]) => (
                    <SidebarMenuSubItem key={key}>
                      <SidebarMenuSubButton asChild isActive={pathname === item.href}>
                        <Link to={item.href}>
                          <span>{item.name}</span>
                          {item.label ? (
                            <span className={cn("flex size-2", "rounded-full", "bg-blue-500")} />
                          ) : null}
                        </Link>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

/* -------------------------------------------------------------------------------------------------
 * Component: AppSidebar
 * -------------------------------------------------------------------------------------------------*/

export function AppSidebar(props: ComponentProps<typeof Sidebar>): ReactNode {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <Sidebar side="left" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={appSidebarData.teams} />
        <SearchForm />
      </SidebarHeader>
      <SidebarContent>
        <NavHomeSection />
        <NavMainSection items={appSidebarData.navMain} />
        <ComponentsSection pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={appSidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
