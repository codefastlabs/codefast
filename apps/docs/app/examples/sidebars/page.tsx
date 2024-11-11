import { type Metadata } from 'next';
import { type JSX } from 'react';

import { SidebarLink } from '@/app/examples/sidebars/_components/sidebar-link';

export const metadata: Metadata = {
  title: 'Sidebar',
};

export default function SidebarPage(): JSX.Element {
  return (
    <main className="grid gap-8 p-6">
      <SidebarLink href="/blocks/sidebar-01" title="Sidebar 01" />
      <SidebarLink href="/blocks/sidebar-02" title="Sidebar 02" />
      <SidebarLink href="/blocks/sidebar-03" title="Sidebar 03" />
      <SidebarLink href="/blocks/sidebar-04" title="Sidebar 04" />
      <SidebarLink href="/blocks/sidebar-05" title="Sidebar 05" />
      <SidebarLink href="/blocks/sidebar-06" title="Sidebar 06" />
      <SidebarLink href="/blocks/sidebar-07" title="Sidebar 07" />
    </main>
  );
}
