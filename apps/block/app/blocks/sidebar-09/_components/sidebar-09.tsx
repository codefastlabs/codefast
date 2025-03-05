import type { ComponentProps, JSX } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  cn,
  Separator,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@codefast/ui';

import { PlaceholderGrid } from '@/app/blocks/_components/placeholder-grid';
import { AppSidebar } from '@/app/blocks/sidebar-09/_components/app-sidebar';

type Sidebar09Props = ComponentProps<'div'>;

export function Sidebar09({ className, ...props }: Sidebar09Props): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      <SidebarProvider
        style={
          {
            '--sidebar-width': '350px',
          } as React.CSSProperties
        }
      >
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4">
            <SidebarTrigger className="-ml-1" />
            <Separator className="mr-2 h-4" orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">All Inboxes</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Inbox</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <PlaceholderGrid className="flex flex-1 flex-col gap-4 p-4" />
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
