'use client';

import type { ChartConfig } from '@codefast/ui';
import type { JSX } from 'react';

import {
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
import { Pie, PieChart } from 'recharts';

export const description = 'A pie chart with stacked sections';

const desktopData = [
  { desktop: 186, fill: 'var(--color-january)', month: 'january' },
  { desktop: 305, fill: 'var(--color-february)', month: 'february' },
  { desktop: 237, fill: 'var(--color-march)', month: 'march' },
  { desktop: 173, fill: 'var(--color-april)', month: 'april' },
  { desktop: 209, fill: 'var(--color-may)', month: 'may' },
];

const mobileData = [
  { fill: 'var(--color-january)', mobile: 80, month: 'january' },
  { fill: 'var(--color-february)', mobile: 200, month: 'february' },
  { fill: 'var(--color-march)', mobile: 120, month: 'march' },
  { fill: 'var(--color-april)', mobile: 190, month: 'april' },
  { fill: 'var(--color-may)', mobile: 130, month: 'may' },
];

const chartConfig = {
  april: {
    color: 'var(--color-chart-4)',
    label: 'April',
  },
  desktop: {
    label: 'Desktop',
  },
  february: {
    color: 'var(--color-chart-2)',
    label: 'February',
  },
  january: {
    color: 'var(--color-chart-1)',
    label: 'January',
  },
  march: {
    color: 'var(--color-chart-3)',
    label: 'March',
  },
  may: {
    color: 'var(--color-chart-5)',
    label: 'May',
  },
  mobile: {
    label: 'Mobile',
  },
  visitors: {
    label: 'Visitors',
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
        <ChartContainer className="mx-auto aspect-square max-h-[15.625rem]" config={chartConfig}>
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
