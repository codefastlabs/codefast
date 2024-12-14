'use client';

import {
  type ChartConfig,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@codefast/ui';
import { TrendingUp } from 'lucide-react';
import { type JSX } from 'react';
import { PolarGrid, RadialBar, RadialBarChart } from 'recharts';

export const description = 'A radial chart with a grid';

const chartData = [
  { browser: 'chrome', fill: 'var(--color-chrome)', visitors: 275 },
  { browser: 'safari', fill: 'var(--color-safari)', visitors: 200 },
  { browser: 'firefox', fill: 'var(--color-firefox)', visitors: 187 },
  { browser: 'edge', fill: 'var(--color-edge)', visitors: 173 },
  { browser: 'other', fill: 'var(--color-other)', visitors: 90 },
];

const chartConfig = {
  chrome: {
    color: 'hsl(var(--color-chart-1))',
    label: 'Chrome',
  },
  edge: {
    color: 'hsl(var(--color-chart-4))',
    label: 'Edge',
  },
  firefox: {
    color: 'hsl(var(--color-chart-3))',
    label: 'Firefox',
  },
  other: {
    color: 'hsl(var(--color-chart-5))',
    label: 'Other',
  },
  safari: {
    color: 'hsl(var(--color-chart-2))',
    label: 'Safari',
  },
  visitors: {
    label: 'Visitors',
  },
} satisfies ChartConfig;

export function ChartRadialGrid(): JSX.Element {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Grid</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[250px]" config={chartConfig}>
          <RadialBarChart data={chartData} innerRadius={30} outerRadius={100}>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="browser" />} cursor={false} />
            <PolarGrid gridType="circle" />
            <RadialBar dataKey="visitors" />
          </RadialBarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Showing total visitors for the last 6 months</div>
      </CardFooter>
    </Card>
  );
}
