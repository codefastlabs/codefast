import { type Metadata } from 'next';
import { type JSX } from 'react';

import { Sidebar02 } from '@/app/blocks/sidebar-02/_components/sidebar-02';

export const metadata: Metadata = {
  title: 'Sidebar 02',
};

export default function Sidebar02Page(): JSX.Element {
  return (
    <main className="">
      <Sidebar02 />
    </main>
  );
}
