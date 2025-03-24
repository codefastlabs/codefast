'use client';

import type { JSX } from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@codefast/ui';
import { CheckIcon, ChevronsUpDownIcon, GalleryVerticalEndIcon } from 'lucide-react';
import { useState } from 'react';

export function VersionSwitcher({
  versions,
  defaultVersion,
}: {
  defaultVersion: string;
  versions: string[];
}): JSX.Element {
  const [selectedVersion, setSelectedVersion] = useState(defaultVersion);

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              size="lg"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <GalleryVerticalEndIcon className="size-4" />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="font-medium">Documentation</span>
                <span className="">v{selectedVersion}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width)">
            {versions.map((version) => (
              <DropdownMenuItem
                key={version}
                onSelect={() => {
                  setSelectedVersion(version);
                }}
              >
                v{version} {version === selectedVersion && <CheckIcon className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
