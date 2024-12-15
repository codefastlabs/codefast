import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar10 } from '@/app/blocks/sidebar-10/_components/sidebar-10';

export const metadata: Metadata = {
  title: 'Sidebar 10',
};

export default function Sidebar10Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar10 />
    </main>
  );
}
