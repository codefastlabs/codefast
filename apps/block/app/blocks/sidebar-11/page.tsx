import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar11 } from '@/app/blocks/sidebar-11/_components/sidebar-11';

export const metadata: Metadata = {
  title: 'Sidebar 11',
};

export default function Sidebar11Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar11 />
    </main>
  );
}
