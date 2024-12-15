'use client';

import type { ChartConfig } from '@codefast/ui';
import type { JSX } from 'react';
import type { ContentType } from 'recharts/types/component/Label';

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
import { Label, Pie, PieChart } from 'recharts';

export const description = 'A donut chart with text';

interface DataItem {
  browser: string;
  fill: string;
  visitors: number;
}

const chartData: DataItem[] = [
  { browser: 'chrome', fill: 'var(--color-chrome)', visitors: 275 },
  { browser: 'safari', fill: 'var(--color-safari)', visitors: 200 },
  { browser: 'firefox', fill: 'var(--color-firefox)', visitors: 287 },
  { browser: 'edge', fill: 'var(--color-edge)', visitors: 173 },
  { browser: 'other', fill: 'var(--color-other)', visitors: 190 },
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

export function ChartPieDonutText(): JSX.Element {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Donut with Text</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[250px]" config={chartConfig}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Pie data={chartData} dataKey="visitors" innerRadius={60} nameKey="browser" strokeWidth={5}>
              <Label content={content} />
            </Pie>
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

const content: ContentType = ({ viewBox }) => {
  const totalVisitors = chartData.reduce((acc, curr) => acc + curr.visitors, 0);

  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
    return (
      <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
        <tspan className="fill-foreground text-3xl font-bold" x={viewBox.cx} y={viewBox.cy}>
          {totalVisitors.toLocaleString()}
        </tspan>
        <tspan className="fill-muted-foreground" x={viewBox.cx} y={(viewBox.cy ?? 0) + 24}>
          Visitors
        </tspan>
      </text>
    );
  }
};
