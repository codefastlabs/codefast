'use client';

import {
  cn,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  Separator,
} from '@codefast/ui';
import { type ComponentProps, type JSX } from 'react';

import { AppSidebar } from '@/app/blocks/sidebar-10/_components/app-sidebar';
import { NavActions } from '@/app/blocks/sidebar-10/_components/nav-actions';
import { data } from '@/app/blocks/sidebar-10/_lib/mocks/data';

type Sidebar10Props = ComponentProps<'div'>;

export function Sidebar10({ className, ...props }: Sidebar10Props): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2">
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
            <div className="ml-auto px-3">
              <NavActions actions={data.actions} />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 px-4 py-10">
            <div className="bg-muted/50 mx-auto h-24 w-full max-w-3xl rounded-xl" />
            <div className="bg-muted/50 mx-auto h-full w-full max-w-3xl rounded-xl" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
