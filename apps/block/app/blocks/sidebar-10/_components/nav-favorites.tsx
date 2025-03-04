'use client';

import type { SidebarGroup } from '@codefast/ui';
import type { ComponentProps, JSX } from 'react';

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@codefast/ui';
import { ArrowUpRightIcon, LinkIcon, MoreHorizontalIcon, StarOffIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';

interface NavFavoritesProps extends ComponentProps<typeof SidebarGroup> {
  favorites: {
    emoji: string;
    name: string;
    url: string;
  }[];
}

export function NavFavorites({ className, favorites, ...props }: NavFavoritesProps): JSX.Element {
  const { isMobile } = useSidebar();

  return (
    <div className={cn('group-data-[collapsible=icon]:hidden', className)} {...props}>
      <SidebarGroupLabel>Favorites</SidebarGroupLabel>
      <SidebarMenu>
        {favorites.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild>
              <Link href={item.url} title={item.name}>
                <span>{item.emoji}</span>
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontalIcon />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align={isMobile ? 'end' : 'start'}
                className="w-56 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
              >
                <DropdownMenuItem>
                  <StarOffIcon className="text-muted-foreground size-4" />
                  <span>Remove from Favorites</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LinkIcon className="text-muted-foreground size-4" />
                  <span>Copy Link</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <ArrowUpRightIcon className="text-muted-foreground size-4" />
                  <span>Open in New Tab</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2Icon className="text-muted-foreground size-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        <SidebarMenuItem>
          <SidebarMenuButton className="text-sidebar-foreground/70">
            <MoreHorizontalIcon />
            <span>More</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </div>
  );
}
