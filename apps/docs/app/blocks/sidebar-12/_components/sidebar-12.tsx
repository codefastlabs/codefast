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

import { AppSidebar } from '@/app/blocks/sidebar-12/_components/app-sidebar';

type Sidebar12Props = ComponentProps<'div'>;

export function Sidebar12({ className, ...props }: Sidebar12Props): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator className="mr-2 h-4" orientation="vertical" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>October 2024</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <div className="grid auto-rows-min gap-4 md:grid-cols-5">
              {Array.from({ length: 20 }).map((_, index) => (
                // eslint-disable-next-line react/no-array-index-key -- key is safe
                <div key={index} className="bg-muted/50 aspect-square rounded-xl" />
              ))}
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
