import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar05 } from '@/app/blocks/sidebar-05/_components/sidebar-05';

export const metadata: Metadata = {
  title: 'Sidebar 05',
};

export default function Sidebar05Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar05 />
    </main>
  );
}
