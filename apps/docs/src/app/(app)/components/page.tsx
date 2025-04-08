import type { Metadata } from 'next';
import type { JSX } from 'react';

import { registryComponents } from '@/app/(app)/components/registry-components';
import { ComponentWrapper } from '@/components/component-wrapper';

const sortedComponents = Object.entries(registryComponents).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

export const metadata: Metadata = {
  title: 'Components',
};

export default function ComponentsPage(): JSX.Element {
  return (
    <div className="@container grid gap-6 p-6">
      {sortedComponents.map(([key, { slug, component: Component }]) => (
        <ComponentWrapper key={key} name={slug}>
          <Component />
        </ComponentWrapper>
      ))}
    </div>
  );
}
