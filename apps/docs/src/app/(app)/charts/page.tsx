import { type Metadata } from 'next';
import { type JSX } from 'react';

import * as Charts from '@/app/(app)/charts/charts';
import { ComponentWrapper } from '@/components/component-wrapper';

export const metadata: Metadata = {
  title: 'Charts',
};

export default function ChartsPage(): JSX.Element {
  const sortedCharts = Object.entries(Charts).sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

  return (
    <div className="grid flex-1 grid-cols-3 items-start gap-4 p-4 2xl:grid-cols-4">
      {sortedCharts.map(([key, Component]) => (
        <ComponentWrapper
          key={key}
          className="**:data-[slot=card]:w-full w-auto data-[name=chartareainteractive]:col-span-3 data-[name=chartbarinteractive]:col-span-3 data-[name=chartlineinteractive]:col-span-3"
          name={key}
        >
          <Component />
        </ComponentWrapper>
      ))}
    </div>
  );
}
