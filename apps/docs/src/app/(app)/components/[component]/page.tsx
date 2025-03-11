import { type Metadata } from 'next';
import { type JSX } from 'react';

import { ComponentWrapper } from '@/components/component-wrapper';
import { TextareaDemo } from '@/registry/demos/textarea-demo';

export const metadata: Metadata = {
  title: 'Component',
};

export default function ComponentPage(): JSX.Element {
  return (
    <div className="grid gap-4 p-4">
      <ComponentWrapper name="textarea">
        <TextareaDemo />
      </ComponentWrapper>
    </div>
  );
}
