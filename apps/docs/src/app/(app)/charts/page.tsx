import { type Metadata } from 'next';
import { type JSX } from 'react';

import { ComponentWrapper } from '@/components/component-wrapper';
import { registryCharts } from '@/registry/registry-charts';

const sortedCharts = Object.entries(registryCharts).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

export const metadata: Metadata = {
  title: 'Charts',
};

export default function ChartsPage(): JSX.Element {
  return (
    <div className="container mx-auto">
      <div className="grid flex-1 items-start gap-6 p-6 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {sortedCharts.map(([key, { slug, component: Component }]) => (
          <ComponentWrapper
            key={key}
            className="**:data-[slot=card]:w-full w-auto lg:data-[name$=-interactive]:col-span-2 xl:data-[name$=-interactive]:col-span-3 2xl:data-[name$=-interactive]:col-span-4"
            classNames={{ body: 'overflow-auto' }}
            name={slug}
          >
            <Component />
          </ComponentWrapper>
        ))}
      </div>
    </div>
  );
}
