'use client';

import type { ChartConfig } from '@codefast/ui';
import type { JSX } from 'react';
import type {
  Formatter,
  NameType,
  ValueType,
} from 'recharts/types/component/DefaultTooltipContent';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@codefast/ui';
import { Bar, BarChart, XAxis } from 'recharts';

export const description = 'A stacked bar chart with a legend';

const chartData = [
  { date: '2024-07-15', running: 450, swimming: 300 },
  { date: '2024-07-16', running: 380, swimming: 420 },
  { date: '2024-07-17', running: 520, swimming: 120 },
  { date: '2024-07-18', running: 140, swimming: 550 },
  { date: '2024-07-19', running: 600, swimming: 350 },
  { date: '2024-07-20', running: 480, swimming: 400 },
];

const chartConfig = {
  running: {
    color: 'hsl(var(--color-chart-1))',
    label: 'Running',
  },
  swimming: {
    color: 'hsl(var(--color-chart-2))',
    label: 'Swimming',
  },
} satisfies ChartConfig;

export function ChartTooltipFormatter(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tooltip - Formatter</CardTitle>
        <CardDescription>Tooltip with custom formatter .</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              axisLine={false}
              dataKey="date"
              tickFormatter={(value: string) => {
                return new Date(value).toLocaleDateString('en-US', {
                  weekday: 'short',
                });
              }}
              tickLine={false}
              tickMargin={10}
            />
            <Bar dataKey="running" fill="var(--color-running)" radius={[0, 0, 4, 4]} stackId="a" />
            <Bar
              dataKey="swimming"
              fill="var(--color-swimming)"
              radius={[4, 4, 0, 0]}
              stackId="a"
            />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel formatter={formatter} />}
              cursor={false}
              defaultIndex={1}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const formatter: Formatter<ValueType, NameType> = (value, name) => (
  <div className="text-muted-foreground flex min-w-[8.125rem] items-center text-xs">
    {chartConfig[name as keyof typeof chartConfig].label || name}
    <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
      {value}
      <span className="text-muted-foreground font-normal">kcal</span>
    </div>
  </div>
);
