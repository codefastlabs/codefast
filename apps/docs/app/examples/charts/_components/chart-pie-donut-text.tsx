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
import { Label, Pie, PieChart } from 'recharts';
import { type ContentType } from 'recharts/types/component/Label';

export const description = 'A donut chart with text';

interface DataItem {
  browser: string;
  fill: string;
  visitors: number;
}

const chartData: DataItem[] = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 287, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 190, fill: 'var(--color-other)' },
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
