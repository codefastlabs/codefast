import type { JSX, ReactNode } from 'react';

import { SidebarInset, SidebarProvider } from '@codefast/ui';
import { cookies } from 'next/headers';

import { AppSidebar } from '@/app/(examples)/dashboard-03/_components/app-sidebar';
import { SiteHeader } from '@/app/(examples)/dashboard-03/_components/site-header';

export default async function DashboardLayout({ children }: { children: ReactNode }): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return (
    <main className="[--header-height:calc(theme(spacing.14))]">
      <SidebarProvider className="flex flex-col" defaultOpen={defaultOpen}>
        <SiteHeader />
        <div className="flex flex-1">
          <AppSidebar />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </SidebarProvider>
    </main>
  );
}
