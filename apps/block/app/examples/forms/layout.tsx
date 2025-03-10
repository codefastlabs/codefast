import type { Metadata } from 'next';
import type { JSX, ReactNode } from 'react';

import { Separator } from '@codefast/ui';
import Image from 'next/image';

import { SidebarNav } from '@/app/examples/forms/_components/sidebar-nav';

export const metadata: Metadata = {
  description: 'Advanced form example using react-hook-form and Zod.',
  title: 'Forms',
};

const sidebarNavItems = [
  {
    href: '/examples/forms',
    title: 'Profile',
  },
  {
    href: '/examples/forms/account',
    title: 'Account',
  },
  {
    href: '/examples/forms/appearance',
    title: 'Appearance',
  },
  {
    href: '/examples/forms/notifications',
    title: 'Notifications',
  },
  {
    href: '/examples/forms/display',
    title: 'Display',
  },
];

export default function SettingsLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <>
      <div className="md:hidden">
        <Image alt="Forms" className="block dark:hidden" height={791} src="/examples/forms-light.png" width={1280} />
        <Image alt="Forms" className="hidden dark:block" height={791} src="/examples/forms-dark.png" width={1280} />
      </div>
      <div className="hidden space-y-6 p-10 pb-16 md:block">
        <div className="space-y-0.5">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings and set e-mail preferences.</p>
        </div>
        <Separator className="my-6" />
        <div className="flex flex-col gap-y-8 lg:flex-row lg:gap-x-12 lg:gap-y-0">
          <aside className="-mx-4 lg:w-1/5">
            <SidebarNav items={sidebarNavItems} />
          </aside>
          <div className="flex-1 lg:max-w-2xl">{children}</div>
        </div>
      </div>
    </>
  );
}
