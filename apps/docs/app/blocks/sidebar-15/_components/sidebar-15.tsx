'use client';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  cn,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@codefast/ui';
import { type ComponentProps, type JSX } from 'react';

import { SidebarLeft } from '@/app/blocks/sidebar-15/_components/sidebar-left';
import { SidebarRight } from '@/app/blocks/sidebar-15/_components/sidebar-right';

type Sidebar15Props = ComponentProps<'div'>;

export function Sidebar15({ className, ...props }: Sidebar15Props): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      <SidebarProvider>
        <SidebarLeft />
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-14 shrink-0 items-center gap-2">
            <div className="flex flex-1 items-center gap-2 px-3">
              <SidebarTrigger />
              <Separator className="mr-2 h-4" orientation="vertical" />
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbPage className="line-clamp-1">Project Management & Task Tracking</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
            <div className="bg-muted/50 mx-auto h-[100vh] w-full max-w-3xl rounded-xl" />
          </div>
        </SidebarInset>
        <SidebarRight />
      </SidebarProvider>
    </div>
  );
}