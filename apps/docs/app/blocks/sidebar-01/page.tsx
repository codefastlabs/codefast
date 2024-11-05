import { type Metadata } from 'next';
import { type JSX } from 'react';

import { Sidebar01 } from '@/app/blocks/sidebar-01/_components/sidebar-01';

export const metadata: Metadata = {
  title: 'Sidebar',
};

export default function Sidebar01Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar01 />
    </main>
  );
}
