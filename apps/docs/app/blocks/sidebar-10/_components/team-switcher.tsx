'use client';

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codefast/ui';
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { type ComponentProps, type JSX, useState } from 'react';

interface TeamSwitcherProps extends ComponentProps<typeof SidebarMenu> {
  teams: {
    logo: React.ElementType;
    name: string;
    plan: string;
  }[];
}

export function TeamSwitcher({ teams, className, ...props }: TeamSwitcherProps): JSX.Element {
  const [activeTeam, setActiveTeam] = useState(teams[0]);

  return (
    <SidebarMenu className={cn('', className)} {...props}>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-fit px-1.5">
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-5 items-center justify-center rounded-md">
                <activeTeam.logo className="size-3" />
              </div>
              <span className="truncate font-semibold">{activeTeam.name}</span>
              <ChevronDownIcon className="opacity-50" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 rounded-lg" side="bottom" sideOffset={4}>
            <DropdownMenuLabel className="text-muted-foreground text-xs">Teams</DropdownMenuLabel>
            {teams.map((team, index) => (
              <DropdownMenuItem
                key={team.name}
                className="gap-2 p-2"
                onClick={() => {
                  setActiveTeam(team);
                }}
              >
                <div className="flex size-6 items-center justify-center rounded-sm border">
                  <team.logo className="size-4 shrink-0" />
                </div>
                {team.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-2 p-2">
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <PlusIcon className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">Add team</div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}