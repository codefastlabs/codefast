import { type Metadata } from 'next';
import { type JSX } from 'react';

export const metadata: Metadata = {
  title: 'Sidebar',
};

export default function SidebarPage(): JSX.Element {
  return (
    <main className="">
      <iframe className="min-h-dvh w-full" src="/blocks/sidebar-01" title="Sidebar 01" />
    </main>
  );
}
