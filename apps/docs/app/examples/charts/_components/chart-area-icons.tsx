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
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@codefast/ui';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { type JSX } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

export const description = 'An area chart with icons';

const chartData = [
  { month: 'January', desktop: 186, mobile: 80 },
  { month: 'February', desktop: 305, mobile: 200 },
  { month: 'March', desktop: 237, mobile: 120 },
  { month: 'April', desktop: 73, mobile: 190 },
  { month: 'May', desktop: 209, mobile: 130 },
  { month: 'June', desktop: 214, mobile: 140 },
];

const chartConfig = {
  desktop: {
    label: 'Desktop',
    color: 'hsl(var(--chart-1))',
    icon: TrendingDown,
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
    icon: TrendingUp,
  },
} satisfies ChartConfig;

export function ChartAreaIcons(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Area Chart - Icons</CardTitle>
        <CardDescription>Showing total visitors for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: 12,
              right: 12,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tickFormatter={(value: string) => value.slice(0, 3)}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
            <Area
              dataKey="mobile"
              fill="var(--color-mobile)"
              fillOpacity={0.4}
              stackId="a"
              stroke="var(--color-mobile)"
              type="natural"
            />
            <Area
              dataKey="desktop"
              fill="var(--color-desktop)"
              fillOpacity={0.4}
              stackId="a"
              stroke="var(--color-desktop)"
              type="natural"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
      <CardFooter>
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div className="flex items-center gap-2 font-medium leading-none">
              Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground flex items-center gap-2 leading-none">January - June 2024</div>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}