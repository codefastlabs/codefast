"use client";

import type { JSX } from "react";

import { SidebarIcon } from "lucide-react";

import { SearchForm } from "@/registry/blocks/sidebar-16/_components/search-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
  Button,
  Separator,
  useSidebar,
} from "@codefast/ui";

export function SiteHeader(): JSX.Element {
  const { toggleSidebar } = useSidebar("SiteHeader");

  return (
    <header className="bg-background sticky top-0 z-50 flex w-full items-center border-b">
      <div className="h-(--header-height) flex w-full items-center gap-2 px-4">
        <Button className="size-8" size="icon" variant="ghost" onClick={toggleSidebar}>
          <SidebarIcon />
        </Button>
        <Separator className="mr-2 h-4" orientation="vertical" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Building Your Application</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Data Fetching</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <SearchForm className="w-full sm:ml-auto sm:w-auto" />
      </div>
    </header>
  );
}
