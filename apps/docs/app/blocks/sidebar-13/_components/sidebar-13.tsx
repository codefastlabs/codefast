'use client';

import type { ComponentProps, JSX } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from '@codefast/ui';
import Link from 'next/link';
import { useState } from 'react';

import { data } from '@/app/blocks/sidebar-13/_lib/mocks/data';

type Sidebar13Props = ComponentProps<'div'>;

export function Sidebar13({ className, ...props }: Sidebar13Props): JSX.Element {
  const [open, setOpen] = useState(true);

  return (
    <div className={cn('', className)} {...props}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm">Open Dialog</Button>
        </DialogTrigger>
        <DialogContent className="grid overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <DialogDescription className="sr-only">Customize your settings here.</DialogDescription>
          <SidebarProvider className="items-start">
            <Sidebar className="hidden md:flex" collapsible="none">
              <SidebarContent>
                <SidebarGroup>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {data.nav.map((item) => (
                        <SidebarMenuItem key={item.name}>
                          <SidebarMenuButton asChild isActive={item.name === 'Messages & media'}>
                            <Link href="#">
                              <item.icon />
                              <span>{item.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
            </Sidebar>
            <main className="flex h-[480px] flex-1 flex-col overflow-hidden">
              <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
                <div className="flex items-center gap-2 px-4">
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem className="hidden md:block">
                        <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator className="hidden md:block" />
                      <BreadcrumbItem>
                        <BreadcrumbPage>Messages & media</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </header>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">
                {Array.from({ length: 10 }).map((_, index) => (
                  // eslint-disable-next-line react/no-array-index-key -- key is safe
                  <div key={index} className="bg-muted/50 aspect-video max-w-3xl rounded-xl" />
                ))}
              </div>
            </main>
          </SidebarProvider>
        </DialogContent>
      </Dialog>
    </div>
  );
}
