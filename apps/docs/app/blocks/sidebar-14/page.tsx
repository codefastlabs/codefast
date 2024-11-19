import { type Metadata } from 'next';
import { type JSX } from 'react';

import { Sidebar14 } from '@/app/blocks/sidebar-14/_components/sidebar-14';

export const metadata: Metadata = {
  title: 'Sidebar 14',
};

export default function Sidebar14Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar14 />
    </main>
  );
}
