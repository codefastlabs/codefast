'use client';

import type { ComponentProps, JSX } from 'react';

import { Sidebar, SidebarContent } from '@codefast/ui';
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
} from 'lucide-react';

import { NavMain } from '@/app/(examples)/dashboard-03/components/nav-main';
import { NavSecondary } from '@/app/(examples)/dashboard-03/components/nav-secondary';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard-03',
      icon: HomeIcon,
    },
    {
      title: 'Analytics',
      url: '/dashboard-03/analytics',
      icon: ChartLineIcon,
    },
    {
      title: 'Orders',
      url: '/dashboard-03/orders',
      icon: ShoppingBagIcon,
    },
    {
      title: 'Products',
      url: '/dashboard-03/products',
      icon: ShoppingCartIcon,
    },
    {
      title: 'Invoices',
      url: '/dashboard-03/invoices',
      icon: FileIcon,
    },
    {
      title: 'Customers',
      url: '/dashboard-03/customers',
      icon: UserIcon,
    },
    {
      title: 'Settings',
      url: '/dashboard-03/settings',
      icon: Settings2Icon,
    },
  ],
  navSecondary: [
    {
      title: 'Support',
      url: '#',
      icon: LifeBuoy,
    },
    {
      title: 'Feedback',
      url: '#',
      icon: Send,
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
