import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar06 } from '@/app/blocks/sidebar-06/_components/sidebar-06';

export const metadata: Metadata = {
  title: 'Sidebar 06',
};

export default function Sidebar06Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar06 />
    </main>
  );
}
