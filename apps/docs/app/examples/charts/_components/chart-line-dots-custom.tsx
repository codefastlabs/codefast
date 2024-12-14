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
import { GitCommitVerticalIcon, TrendingUpIcon } from 'lucide-react';
import { type JSX } from 'react';
import { CartesianGrid, Line, LineChart, XAxis } from 'recharts';
import { type LineDot } from 'recharts/types/cartesian/Line';
import { type Props as DotProps } from 'recharts/types/shape/Dot';

export const description = 'A line chart with custom dots';

interface DataItem {
  desktop: number;
  mobile: number;
  month: string;
}

const chartData: DataItem[] = [
  { desktop: 186, mobile: 80, month: 'January' },
  { desktop: 305, mobile: 200, month: 'February' },
  { desktop: 237, mobile: 120, month: 'March' },
  { desktop: 73, mobile: 190, month: 'April' },
  { desktop: 209, mobile: 130, month: 'May' },
  { desktop: 214, mobile: 140, month: 'June' },
];

const chartConfig = {
  desktop: {
    color: 'hsl(var(--color-chart-1))',
    label: 'Desktop',
  },
  mobile: {
    color: 'hsl(var(--color-chart-2))',
    label: 'Mobile',
  },
} satisfies ChartConfig;

export function ChartLineDotsCustom(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Custom Dots</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
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
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Line dataKey="desktop" dot={dot} stroke="var(--color-desktop)" strokeWidth={2} type="natural" />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUpIcon className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">Showing total visitors for the last 6 months</div>
      </CardFooter>
    </Card>
  );
}

const dot: LineDot = ({
  cx = 0,
  cy = 0,
  payload,
}: DotProps & {
  payload: DataItem;
}) => {
  const r = 24;

  return (
    <GitCommitVerticalIcon
      key={payload.month}
      fill="hsl(var(--color-background))"
      height={r}
      stroke="var(--color-desktop)"
      width={r}
      x={cx - r / 2}
      y={cy - r / 2}
    />
  );
};
