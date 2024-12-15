import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar09 } from '@/app/blocks/sidebar-09/_components/sidebar-09';

export const metadata: Metadata = {
  title: 'Sidebar 09',
};

export default function Sidebar09Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar09 />
    </main>
  );
}
