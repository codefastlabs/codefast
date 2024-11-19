import { type Metadata } from 'next';
import { type JSX } from 'react';

import { Sidebar15 } from '@/app/blocks/sidebar-15/_components/sidebar-15';

export const metadata: Metadata = {
  title: 'Sidebar 15',
};

export default function Sidebar15Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar15 />
    </main>
  );
}
