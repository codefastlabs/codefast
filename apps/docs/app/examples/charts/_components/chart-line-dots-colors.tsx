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
import { CartesianGrid, Dot, Line, LineChart } from 'recharts';
import { type LineDot } from 'recharts/types/cartesian/Line';
import { type Props as DotProps } from 'recharts/types/shape/Dot';

export const description = 'A line chart with dots and colors';

interface DataItem {
  browser: string;
  fill: string;
  visitors: number;
}

const chartData: DataItem[] = [
  { browser: 'chrome', visitors: 275, fill: 'var(--color-chrome)' },
  { browser: 'safari', visitors: 200, fill: 'var(--color-safari)' },
  { browser: 'firefox', visitors: 187, fill: 'var(--color-firefox)' },
  { browser: 'edge', visitors: 173, fill: 'var(--color-edge)' },
  { browser: 'other', visitors: 90, fill: 'var(--color-other)' },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
    color: 'hsl(var(--color-chart-2))',
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

export function ChartLineDotsColors(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Line Chart - Dots Colors</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={chartData}
            margin={{
              top: 24,
              left: 24,
              right: 24,
            }}
          >
            <CartesianGrid vertical={false} />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel indicator="line" nameKey="visitors" />}
              cursor={false}
            />
            <Line dataKey="visitors" dot={dot} stroke="var(--color-visitors)" strokeWidth={2} type="natural" />
          </LineChart>
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

const dot: LineDot = ({
  payload,
  ...props
}: DotProps & {
  payload: DataItem;
}) => {
  return <Dot key={payload.browser} cx={props.cx} cy={props.cy} fill={payload.fill} r={5} stroke={payload.fill} />;
};
