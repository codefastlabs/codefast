import { type Metadata } from 'next';
import { type JSX } from 'react';

import { Sidebar12 } from '@/app/blocks/sidebar-12/_components/sidebar-12';

export const metadata: Metadata = {
  title: 'Sidebar 12',
};

export default function Sidebar12Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar12 />
    </main>
  );
}
