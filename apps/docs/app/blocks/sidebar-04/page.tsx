import { type Metadata } from 'next';
import { type JSX } from 'react';

import { Sidebar04 } from '@/app/blocks/sidebar-04/_components/sidebar-04';

export const metadata: Metadata = {
  title: 'Sidebar 04',
};

export default function Sidebar04Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar04 />
    </main>
  );
}
