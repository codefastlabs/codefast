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
import * as React from 'react';
import { type JSX } from 'react';
import { Pie, PieChart } from 'recharts';

export const description = 'A pie chart with stacked sections';

const desktopData = [
  { month: 'january', desktop: 186, fill: 'var(--color-january)' },
  { month: 'february', desktop: 305, fill: 'var(--color-february)' },
  { month: 'march', desktop: 237, fill: 'var(--color-march)' },
  { month: 'april', desktop: 173, fill: 'var(--color-april)' },
  { month: 'may', desktop: 209, fill: 'var(--color-may)' },
];

const mobileData = [
  { month: 'january', mobile: 80, fill: 'var(--color-january)' },
  { month: 'february', mobile: 200, fill: 'var(--color-february)' },
  { month: 'march', mobile: 120, fill: 'var(--color-march)' },
  { month: 'april', mobile: 190, fill: 'var(--color-april)' },
  { month: 'may', mobile: 130, fill: 'var(--color-may)' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  desktop: {
    label: 'Desktop',
  },
  mobile: {
    label: 'Mobile',
  },
  january: {
    label: 'January',
    color: 'hsl(var(--chart-1))',
  },
  february: {
    label: 'February',
    color: 'hsl(var(--chart-2))',
  },
  march: {
    label: 'March',
    color: 'hsl(var(--chart-3))',
  },
  april: {
    label: 'April',
    color: 'hsl(var(--chart-4))',
  },
  may: {
    label: 'May',
    color: 'hsl(var(--chart-5))',
  },
} satisfies ChartConfig;

export function ChartPieStacked(): JSX.Element {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Stacked</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[250px]" config={chartConfig}>
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="line"
                  labelFormatter={(_, payload) => {
                    return chartConfig[payload[0].dataKey as keyof typeof chartConfig].label;
                  }}
                  labelKey="visitors"
                  nameKey="month"
                />
              }
            />
            <Pie data={desktopData} dataKey="desktop" outerRadius={60} />
            <Pie data={mobileData} dataKey="mobile" innerRadius={70} outerRadius={90} />
          </PieChart>
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