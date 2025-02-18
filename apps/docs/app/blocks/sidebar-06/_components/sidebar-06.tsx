import type { ComponentProps, JSX } from 'react';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Separator,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
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
import { GalleryVerticalEndIcon, MoreHorizontalIcon } from 'lucide-react';
import Link from 'next/link';

import { data } from '@/app/blocks/sidebar-06/_lib/mocks/data';

type Sidebar06Props = ComponentProps<'div'>;

export function Sidebar06({ className, ...props }: Sidebar06Props): JSX.Element {
  return (
    <div className={cn('', className)} {...props}>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild size="lg">
                  <Link href="#">
                    <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                      <GalleryVerticalEndIcon className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">Documentation</span>
                      <span className="">v1.0.0</span>
                    </div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {data.navMain.map((nav) => (
                  <DropdownMenu key={nav.title}>
                    <SidebarMenuItem>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                          {nav.title} <MoreHorizontalIcon className="ml-auto" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      {nav.items.length > 0 ? (
                        <DropdownMenuContent
                          align="end"
                          className="min-w-56 rounded-lg"
                          side="bottom"
                        >
                          {nav.items.map((item) => (
                            <DropdownMenuItem key={item.title} asChild>
                              <Link href={item.url}>{item.title}</Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      ) : null}
                    </SidebarMenuItem>
                  </DropdownMenu>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <div className="p-1">
              <Card className="shadow-none">
                <form>
                  <CardHeader className="p-4 pb-0">
                    <CardTitle className="text-sm">Subscribe to our newsletter</CardTitle>
                    <CardDescription>
                      Opt-in to receive updates and news about the sidebar.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2.5 p-4">
                    <SidebarInput placeholder="Email" type="email" />
                    <Button
                      className="bg-sidebar-primary text-sidebar-primary-foreground w-full shadow-none"
                      size="sm"
                    >
                      Subscribe
                    </Button>
                  </CardContent>
                </form>
              </Card>
            </div>
          </SidebarFooter>
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
