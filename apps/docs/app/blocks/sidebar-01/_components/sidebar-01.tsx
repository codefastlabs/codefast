'use client';

import type { ComponentProps, JSX } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Label,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@codefast/ui';
import { CheckIcon, ChevronsUpDownIcon, GalleryVerticalEndIcon, SearchIcon } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { data } from '@/app/blocks/sidebar-01/_lib/mocks/data';

type Sidebar01Props = ComponentProps<'div'>;

export function Sidebar01({ className, ...props }: Sidebar01Props): JSX.Element {
  const [selectedVersion, setSelectedVersion] = useState(data.versions[0]);

  return (
    <div className={cn('', className)} {...props}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
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
                        <span className="font-semibold">Documentation</span>
                        <span className="">v{selectedVersion}</span>
                      </div>
                      <ChevronsUpDownIcon className="ml-auto" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                    {data.versions.map((version) => (
                      <DropdownMenuItem
                        key={version}
                        onSelect={() => {
                          setSelectedVersion(version);
                        }}
                      >
                        v{version} {version === selectedVersion && <CheckIcon className="ml-auto size-4" />}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            <form>
              <SidebarGroup className="py-0">
                <SidebarGroupContent className="relative">
                  <Label className="sr-only" htmlFor="search">
                    Search
                  </Label>
                  <SidebarInput className="pl-8" id="search" placeholder="Search the docs..." />
                  <SearchIcon className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
                </SidebarGroupContent>
              </SidebarGroup>
            </form>
          </SidebarHeader>
          <SidebarContent>
            {/* We create a SidebarGroup for each parent. */}
            {data.navMain.map((nav) => (
              <SidebarGroup key={nav.title}>
                <SidebarGroupLabel>{nav.title}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {nav.items.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={item.isActive}>
                          <Link href={item.url}>{item.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator className="mr-2 h-4" orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Building Your Application</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
              <div className="bg-muted/50 aspect-video rounded-xl" />
            </div>
            <div className="bg-muted/50 min-h-[100vh] flex-1 rounded-xl md:min-h-min" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
