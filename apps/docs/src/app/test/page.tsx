import { type Metadata } from 'next';
import { type JSX } from 'react';

import { BlockDisplay } from '@/components/block-display';

export const metadata: Metadata = {
  title: 'Test',
};

export default function TestPage(): JSX.Element {
  return (
    <div className="">
      <BlockDisplay name="dashboard-01" />
    </div>
  );
}
