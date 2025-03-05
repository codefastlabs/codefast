import type { Metadata } from 'next';
import type { JSX } from 'react';

import { Sidebar07 } from '@/app/blocks/sidebar-07/_components/sidebar-07';

export const metadata: Metadata = {
  title: 'Sidebar 07',
};

export default function Sidebar07Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar07 />
    </main>
  );
}
