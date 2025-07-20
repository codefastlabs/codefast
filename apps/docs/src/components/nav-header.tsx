"use client";

import type { ComponentProps, JSX } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@codefast/ui";

interface NavItem {
  href: string;
  label: string;
}

export function NavHeader(props: ComponentProps<typeof NavigationMenu>): JSX.Element {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { href: "/", label: "Home" },
    { href: "/components", label: "Components" },
    { href: "/charts", label: "Charts" },
  ];

  return (
    <NavigationMenu {...props}>
      <NavigationMenuList className="**:data-[slot=navigation-menu-link]:py-1 **:data-[slot=navigation-menu-link]:font-medium gap-2 *:data-[slot=navigation-menu-item]:h-7">
        {navItems.map((item) => (
          <NavigationMenuItem key={item.href}>
            <NavigationMenuLink asChild data-active={pathname === item.href}>
              <Link href={item.href}>{item.label}</Link>
            </NavigationMenuLink>
          </NavigationMenuItem>
        ))}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
