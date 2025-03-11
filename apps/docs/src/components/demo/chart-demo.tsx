import type { JSX } from 'react';

import { ChartAreaDemo } from '@/components/demo/chart-area-demo';
import { ChartBarDemo } from '@/components/demo/chart-bar-demo';
import { ChartLineDemo } from '@/components/demo/chart-line-demo';
import { GridWrapper } from '@/components/grid-wrapper';
import { ChartBarMixed } from '@/registry/charts/chart-bar-mixed';

export function ChartDemo(): JSX.Element {
  return (
    <GridWrapper>
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
