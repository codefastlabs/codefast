'use client';

import type { Icon } from '@tabler/icons-react';
import type { ComponentProps, JSX } from 'react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Skeleton,
  Switch,
} from '@codefast/ui';
import { IconBrightness } from '@tabler/icons-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export function NavSecondary({
  items,
  ...props
}: ComponentProps<typeof SidebarGroup> & {
  items: {
    icon: Icon;
    title: string;
    url: string;
  }[];
}): JSX.Element {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <a href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem className="group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton asChild>
              <label>
                <IconBrightness />
                <span>Dark Mode</span>
                {mounted ? (
                  <Switch
                    checked={resolvedTheme !== 'light'}
                    className="ml-auto"
                    onCheckedChange={() => {
                      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
                    }}
                  />
                ) : (
                  <Skeleton className="ml-auto h-4 w-8 rounded-full" />
                )}
              </label>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
