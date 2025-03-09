import type { JSX } from 'react';

import { ChartAreaDemo } from '@/components/chart-area-demo';
import { ChartBarDemo } from '@/components/chart-bar-demo';
import { ChartLineDemo } from '@/components/chart-line-demo';
import { ChartBarMixed } from '@/registry/charts/chart-bar-mixed';

export function ChartDemo(): JSX.Element {
  return (
    <div className="@2xl:grid-cols-2 @6xl:grid-cols-3 grid w-full max-w-screen-2xl gap-4 *:data-[slot=card]:flex-1">
      <ChartAreaDemo />
      <ChartBarDemo />
      <ChartBarMixed />
      <div className="@6xl:hidden">
        <ChartLineDemo />
      </div>
    </div>
  );
}
