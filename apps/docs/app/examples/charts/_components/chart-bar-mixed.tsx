'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@codefast/ui';
import { TrendingUp } from 'lucide-react';
import { type JSX } from 'react';
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

export const description = 'A mixed bar chart';

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

export function ChartBarMixed(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Mixed</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            layout="vertical"
            margin={{
              left: 0,
            }}
          >
            <YAxis
              axisLine={false}
              dataKey="browser"
              tickFormatter={(value) => chartConfig[value as keyof typeof chartConfig].label}
              tickLine={false}
              tickMargin={10}
              type="category"
            />
            <XAxis hide dataKey="visitors" type="number" />
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Bar dataKey="visitors" layout="vertical" radius={5} />
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Showing total visitors for the last 6 months</div>
      </CardFooter>
    </Card>
  );
}
