import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar13 } from '@/app/blocks/sidebar-13/_components/sidebar-13';

export const metadata: Metadata = {
  title: 'Sidebar 13',
};

export default function Sidebar13Page(): JSX.Element {
  return (
    <main className="flex h-svh items-center justify-center">
      <Sidebar13 />
    </main>
  );
}
