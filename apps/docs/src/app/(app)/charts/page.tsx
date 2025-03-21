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
    <div className="grid flex-1 items-start gap-4 p-4 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {sortedCharts.map(([key, { component: Component }]) => (
        <ComponentWrapper
          key={key}
          className="**:data-[slot=card]:w-full w-auto lg:data-[name=chartareainteractive]:col-span-2 lg:data-[name=chartbarinteractive]:col-span-2 lg:data-[name=chartlineinteractive]:col-span-2 xl:data-[name=chartareainteractive]:col-span-3 xl:data-[name=chartbarinteractive]:col-span-3 xl:data-[name=chartlineinteractive]:col-span-3"
          name={key}
        >
          <Component />
        </ComponentWrapper>
      ))}
    </div>
  );
}
