import { cn } from "@codefast/tailwind-variants";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@codefast/ui/sidebar";
import { ChevronsUpDownIcon, PlusIcon } from "lucide-react";
import { useState } from "react";
import type { ElementType } from "react";

export function TeamSwitcher({
  teams,
}: {
  teams: Array<{
    name: string;
    logo: ElementType;
    plan: string;
  }>;
}) {
  const { isMobile } = useSidebar("TeamSwitcher");
  const [activeTeam, setActiveTeam] = useState(teams[0]);

  if (!activeTeam) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
            >
              <div
                className={cn(
                  "flex aspect-square size-8 items-center justify-center",
                  "rounded-xl",
                  "bg-sidebar-primary text-sidebar-primary-foreground",
                )}
              >
                <activeTeam.logo className="size-4" />
              </div>
              <div className={cn("grid flex-1", "text-left text-sm leading-tight")}>
                <span className="truncate font-medium">{activeTeam.name}</span>
                <span className="truncate text-xs">{activeTeam.plan}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className={cn("w-(--radix-dropdown-menu-trigger-width) min-w-56", "rounded-xl")}
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">Teams</DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                onClick={() => setActiveTeam(team)}
                className={cn("gap-2", "p-2")}
              >
                <div className={cn("flex size-6 items-center justify-center", "rounded-lg border")}>
                  <team.logo className="size-3.5 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className={cn("gap-2", "p-2")}>
              <div
                className={cn(
                  "flex size-6 items-center justify-center",
                  "rounded-lg border",
                  "bg-transparent",
                )}
              >
                <PlusIcon className="size-4" />
              </div>
              <div className="font-medium text-muted-foreground">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
