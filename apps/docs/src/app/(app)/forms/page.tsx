import { type Metadata } from 'next';
import { type JSX } from 'react';

import { FormsDemo } from '@/components/demo/forms-demo';

export const metadata: Metadata = {
  title: 'Forms',
};

export default function FormsPage(): JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <FormsDemo />
    </div>
  );
}
