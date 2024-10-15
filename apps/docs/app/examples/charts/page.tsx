import { ChartAreaAxes } from '@/app/examples/charts/_components/chart-area-axes';
import { ChartAreaDefault } from '@/app/examples/charts/_components/chart-area-default';
import { type Metadata } from 'next';
import { type JSX } from 'react';

export const metadata: Metadata = {
  title: 'Charts',
};

export default function ChartsPage(): JSX.Element {
  return (
    <main className="grid gap-4">
      <div className="grid flex-1 scroll-mt-20 items-start gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:gap-10">
        <ChartAreaDefault />
        <ChartAreaAxes />
      </div>
    </main>
  );
}
