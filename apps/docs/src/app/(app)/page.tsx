import { type Metadata } from 'next';
import { type JSX } from 'react';

import { ChartDemo } from '@/components/chart-demo';
import { ComponentWrapper } from '@/components/component-wrapper';

export const metadata: Metadata = {
  title: 'App',
};

export default function AppPage(): JSX.Element {
  return (
    <div className="@container grid flex-1 gap-4 p-4">
      <ComponentWrapper className="w-full" name="chart">
        <ChartDemo />
      </ComponentWrapper>
    </div>
  );
}
