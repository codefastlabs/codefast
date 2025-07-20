"use client";

import type { JSX } from "react";

import { SidebarIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { Fragment, useMemo } from "react";

import { ModeToggle } from "@/app/(examples)/examples/dashboard-03/_components/mode-toggle";
import { NavUser } from "@/app/(examples)/examples/dashboard-03/_components/nav-user";
import { SearchForm } from "@/app/(examples)/examples/dashboard-03/_components/search-form";
import { ThemeSelector } from "@/components/theme-selector";
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
  const pathname = usePathname();

  // Faux breadcrumbs for demo.
  const breadcrumbs = useMemo(() => {
    return pathname
      .split("/")
      .filter((path) => path !== "")
      .map((path, index, array) => ({
        href: `/${array.slice(0, index + 1).join("/")}`,
        label: path.replaceAll("-", " "),
      }));
  }, [pathname]);

  return (
    <header
      className="bg-background sticky top-0 z-50 flex w-full items-center border-b"
      data-slot="site-header"
    >
      <div className="h-(--header-height) flex w-full items-center gap-2 px-2 pr-4">
        <Button
          className="gap-2.5 has-[>svg]:px-2"
          size="sm"
          variant="ghost"
          onClick={toggleSidebar}
        >
          <SidebarIcon />
          <span className="truncate font-medium">Acme Inc</span>
        </Button>
        <Separator className="mr-2 data-[orientation=vertical]:h-4" orientation="vertical" />
        <Breadcrumb className="hidden sm:block">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink className="capitalize" href="/">
                Home
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            {breadcrumbs.map((breadcrumb, index) =>
              index === breadcrumbs.length - 1 ? (
                <BreadcrumbItem key={index}>
                  <BreadcrumbPage className="capitalize">{breadcrumb.label}</BreadcrumbPage>
                </BreadcrumbItem>
              ) : (
                <Fragment key={index}>
                  <BreadcrumbItem>
                    <BreadcrumbLink className="capitalize" href={breadcrumb.href}>
                      {breadcrumb.label}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                </Fragment>
              ),
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <SearchForm className="w-fullsm:w-auto" />
          <ThemeSelector />
          <ModeToggle />
          <NavUser
            user={{
              avatar: "/avatars/codefast-ui.webp",
              email: "m@example.com",
              name: "@codefast/ui",
            }}
          />
        </div>
      </div>
    </header>
  );
}
