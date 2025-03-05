import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar03 } from '@/app/blocks/sidebar-03/_components/sidebar-03';

export const metadata: Metadata = {
  title: 'Sidebar 03',
};

export default function Sidebar03Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar03 />
    </main>
  );
}
