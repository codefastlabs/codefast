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
import { Label, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';
import { type ContentType } from 'recharts/types/component/Label';

export const description = 'A radial chart with stacked sections';

const chartData = [{ month: 'january', desktop: 1260, mobile: 570 }];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ChartRadialStacked(): JSX.Element {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Stacked</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-1 items-center pb-0">
        <ChartContainer className="mx-auto aspect-square w-full max-w-[250px]" config={chartConfig}>
          <RadialBarChart data={chartData} endAngle={180} innerRadius={80} outerRadius={130}>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <PolarRadiusAxis axisLine={false} tick={false} tickLine={false}>
              <Label content={content} />
            </PolarRadiusAxis>
            <RadialBar
              className="stroke-transparent stroke-2"
              cornerRadius={5}
              dataKey="desktop"
              fill="var(--color-desktop)"
              stackId="a"
            />
            <RadialBar
              className="stroke-transparent stroke-2"
              cornerRadius={5}
              dataKey="mobile"
              fill="var(--color-mobile)"
              stackId="a"
            />
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

const content: ContentType = ({ viewBox }) => {
  const totalVisitors = chartData[0].desktop + chartData[0].mobile;

  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
    return (
      <text textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
        <tspan className="fill-foreground text-2xl font-bold" x={viewBox.cx} y={(viewBox.cy || 0) - 16}>
          {totalVisitors.toLocaleString()}
        </tspan>
        <tspan className="fill-muted-foreground" x={viewBox.cx} y={(viewBox.cy || 0) + 4}>
          Visitors
        </tspan>
      </text>
    );
  }
};