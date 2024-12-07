'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from '@codefast/ui';
import { type JSX } from 'react';
import { Pie, PieChart } from 'recharts';

export const description = 'A pie chart with a legend';

const chartData = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 90, fill: 'var(--color-other)' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  chrome: {
    label: 'Chrome',
    color: 'hsl(var(--color-chart-1))',
  },
  safari: {
    label: 'Safari',
    color: 'hsl(var(--color-chart-2))',
  },
  firefox: {
    label: 'Firefox',
    color: 'hsl(var(--color-chart-3))',
  },
  edge: {
    label: 'Edge',
    color: 'hsl(var(--color-chart-4))',
  },
  other: {
    label: 'Other',
    color: 'hsl(var(--color-chart-5))',
  },
} satisfies ChartConfig;

export function ChartPieLegend(): JSX.Element {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Legend</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[300px]" config={chartConfig}>
          <PieChart>
            <Pie data={chartData} dataKey="visitors" />
            <ChartLegend
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              content={<ChartLegendContent nameKey="browser" />}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
