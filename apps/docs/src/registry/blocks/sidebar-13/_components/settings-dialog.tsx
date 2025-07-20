"use client";

import type { JSX } from "react";

import {
  BellIcon,
  CheckIcon,
  GlobeIcon,
  HomeIcon,
  KeyboardIcon,
  LinkIcon,
  LockIcon,
  MenuIcon,
  MessageCircleIcon,
  PaintbrushIcon,
  SettingsIcon,
  VideoIcon,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
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
} from "@codefast/ui";

const data = {
  nav: [
    { icon: BellIcon, name: "Notifications" },
    { icon: MenuIcon, name: "Navigation" },
    { icon: HomeIcon, name: "Home" },
    { icon: PaintbrushIcon, name: "Appearance" },
    { icon: MessageCircleIcon, name: "Messages & media" },
    { icon: GlobeIcon, name: "Language & region" },
    { icon: KeyboardIcon, name: "Accessibility" },
    { icon: CheckIcon, name: "Mark as read" },
    { icon: VideoIcon, name: "Audio & video" },
    { icon: LinkIcon, name: "Connected accounts" },
    { icon: LockIcon, name: "Privacy & visibility" },
    { icon: SettingsIcon, name: "Advanced" },
  ],
};

export function SettingsDialog(): JSX.Element {
  const [open, setOpen] = useState(true);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">Open Dialog</Button>
      </DialogTrigger>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
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
                        <SidebarMenuButton asChild isActive={item.name === "Messages & media"}>
                          <Link href="/">
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
            <header className="group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear">
              <div className="flex items-center gap-2 px-4">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/">Settings</BreadcrumbLink>
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
                <div key={index} className="bg-muted/50 aspect-video max-w-3xl rounded-xl" />
              ))}
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}
