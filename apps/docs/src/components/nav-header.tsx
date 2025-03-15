'use client';

import type { JSX } from 'react';

import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from '@codefast/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavHeader(): JSX.Element {
  const pathname = usePathname();

  return (
    <NavigationMenu>
      <NavigationMenuList className="**:data-[slot=navigation-menu-link]:py-1 **:data-[slot=navigation-menu-link]:font-medium gap-2 *:data-[slot=navigation-menu-item]:h-7">
        <NavigationMenuItem>
          <NavigationMenuLink asChild data-active={pathname === '/'}>
            <Link href="/">Home</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild data-active={pathname === '/charts'}>
            <Link href="/charts">Charts</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink asChild data-active={pathname === '/forms'}>
            <Link href="/forms">Forms</Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
