import type { JSX } from 'react';

import { ChartAreaDemo } from '@/components/chart-area-demo';
import { ChartBarDemo } from '@/components/chart-bar-demo';
import { ChartLineDemo } from '@/components/chart-line-demo';
import { GridWrapper } from '@/components/grid-wrapper';
import { ChartBarMixed } from '@/registry/charts/chart-bar-mixed';

export function ChartDemo(): JSX.Element {
  return (
    <GridWrapper className="*:grid *:place-items-center">
      <div className="">
        <ChartAreaDemo />
      </div>

      <div className="">
        <ChartBarDemo />
      </div>

      <div className="">
        <ChartBarMixed />
      </div>

      <div className="">
        <ChartLineDemo />
      </div>
    </GridWrapper>
  );
}
