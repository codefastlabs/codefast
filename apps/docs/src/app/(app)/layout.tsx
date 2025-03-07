import type { JSX, ReactNode } from 'react';

import { SidebarProvider } from '@codefast/ui';
import { cookies } from 'next/headers';

export default async function AppLayout({ children }: Readonly<{ children: ReactNode }>): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';

  return <SidebarProvider defaultOpen={defaultOpen}>{children}</SidebarProvider>;
}
