import { type Metadata } from 'next';
import { type JSX } from 'react';

import { Sidebar08 } from '@/app/blocks/sidebar-08/_components/sidebar-08';

export const metadata: Metadata = {
  title: 'Sidebar 08',
};

export default function Sidebar08Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar08 />
    </main>
  );
}
