"use client";

import {
  ChartLineIcon,
  FileIcon,
  HomeIcon,
  LifeBuoy,
  Send,
  Settings2Icon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  UserIcon,
} from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { NavMain } from "@/app/(examples)/examples/dashboard-03/_components/nav-main";
import { NavSecondary } from "@/app/(examples)/examples/dashboard-03/_components/nav-secondary";
import { Sidebar, SidebarContent } from "@codefast/ui";

const data = {
  navMain: [
    {
      icon: HomeIcon,
      title: "Dashboard",
      url: "/examples/dashboard-03",
    },
    {
      icon: ChartLineIcon,
      title: "Analytics",
      url: "/examples/dashboard-03/analytics",
    },
    {
      icon: ShoppingBagIcon,
      title: "Orders",
      url: "/examples/dashboard-03/orders",
    },
    {
      icon: ShoppingCartIcon,
      title: "Products",
      url: "/examples/dashboard-03/products",
    },
    {
      icon: FileIcon,
      title: "Invoices",
      url: "/examples/dashboard-03/invoices",
    },
    {
      icon: UserIcon,
      title: "Customers",
      url: "/examples/dashboard-03/customers",
    },
    {
      icon: Settings2Icon,
      title: "Settings",
      url: "/examples/dashboard-03/settings",
    },
  ],
  navSecondary: [
    {
      icon: LifeBuoy,
      title: "Support",
      url: "#",
    },
    {
      icon: Send,
      title: "Feedback",
      url: "#",
    },
  ],
};

export function AppSidebar({ ...props }: ComponentProps<typeof Sidebar>): JSX.Element {
  return (
    <Sidebar className="top-(--header-height) h-[calc(100svh-var(--header-height))]!" {...props}>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary className="mt-auto" items={data.navSecondary} />
      </SidebarContent>
    </Sidebar>
  );
}
