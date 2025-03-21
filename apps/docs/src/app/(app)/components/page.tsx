import { type Metadata } from 'next';
import { type JSX } from 'react';

import { registries } from '@/app/(app)/components/[component]/registries';
import { ComponentWrapper } from '@/components/component-wrapper';

export const metadata: Metadata = {
  title: 'Components',
};

export default function ComponentsPage(): JSX.Element {
  const sortedComponents = Object.entries(registries).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  return (
    <div className="@container grid gap-4 p-4 2xl:container 2xl:mx-auto">
      {sortedComponents.map(([key, registry]) => (
        <ComponentWrapper key={key} name={registry.title}>
          <registry.component />
        </ComponentWrapper>
      ))}
    </div>
  );
}
