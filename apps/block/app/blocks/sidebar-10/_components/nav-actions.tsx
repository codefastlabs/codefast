'use client';

import type { LucideIcon } from 'lucide-react';
import type { ComponentProps, JSX } from 'react';

import {
  Button,
  cn,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codefast/ui';
import { MoreHorizontalIcon, StarIcon } from 'lucide-react';
import { useEffect, useState } from 'react';

interface NavActionsProps extends ComponentProps<'div'> {
  actions: {
    icon: LucideIcon;
    label: string;
  }[][];
}

export function NavActions({ actions, className, ...props }: NavActionsProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(true);
  }, []);

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)} {...props}>
      <div className="text-muted-foreground hidden font-medium md:inline-block">Edit Oct 08</div>
      <Button icon className="h-7 w-7" size="2xs" variant="ghost">
        <StarIcon />
      </Button>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button icon className="data-[state=open]:bg-accent h-7 w-7" size="2xs" variant="ghost">
            <MoreHorizontalIcon />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-56 overflow-hidden rounded-lg p-0">
          <Sidebar className="bg-transparent" collapsible="none">
            <SidebarContent>
              {actions.map((group, index) => (
                // eslint-disable-next-line react/no-array-index-key -- key is safe
                <SidebarGroup key={index} className="border-b last:border-none">
                  <SidebarGroupContent className="gap-0">
                    <SidebarMenu>
                      {group.map((item, index2) => (
                        // eslint-disable-next-line react/no-array-index-key -- key is safe
                        <SidebarMenuItem key={index2}>
                          <SidebarMenuButton>
                            <item.icon />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>
        </PopoverContent>
      </Popover>
    </div>
  );
}
