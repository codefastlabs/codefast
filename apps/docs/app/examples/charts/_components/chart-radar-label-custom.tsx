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
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from 'recharts';

export const description = 'A radar chart with a custom label';

interface DataItem {
  desktop: number;
  mobile: number;
  month: string;
}

const chartData: DataItem[] = [
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
  },
  mobile: {
    label: 'Mobile',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ChartRadarLabelCustom(): JSX.Element {
  return (
    <Card>
      <CardHeader className="items-center pb-4">
        <CardTitle>Radar Chart - Custom Label</CardTitle>
        <CardDescription>Showing total visitors for the last 6 months</CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[250px]" config={chartConfig}>
          <RadarChart
            data={chartData}
            margin={{
              top: 10,
              right: 10,
              bottom: 10,
              left: 10,
            }}
          >
            <ChartTooltip content={<ChartTooltipContent indicator="line" />} cursor={false} />
            <PolarAngleAxis dataKey="month" tick={<PolarAngleAxisTick />} />
            <PolarGrid />
            <Radar dataKey="desktop" fill="var(--color-desktop)" fillOpacity={0.6} />
            <Radar dataKey="mobile" fill="var(--color-mobile)" />
          </RadarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground flex items-center gap-2 leading-none">January - June 2024</div>
      </CardFooter>
    </Card>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TODO: PolarAngleAxisTick
 * -------------------------------------------------------------------------- */

interface PolarAngleAxisTickProps {
  index?: number;
  textAnchor?: 'start' | 'middle' | 'end';
  x?: number;
  y?: number;
}

export function PolarAngleAxisTick({
  x = 0,
  y = 0,
  textAnchor,
  index,
  ...props
}: PolarAngleAxisTickProps): JSX.Element | null {
  const data = index ? chartData[index] : null;

  if (!data) {
    return null;
  }

  return (
    <text fontSize={13} fontWeight={500} textAnchor={textAnchor} x={x} y={index === 0 ? y - 10 : y} {...props}>
      <tspan>{data.desktop}</tspan>
      <tspan className="fill-muted-foreground">/</tspan>
      <tspan>{data.mobile}</tspan>
      <tspan className="fill-muted-foreground" dy="1rem" fontSize={12} x={x}>
        {data.month}
      </tspan>
    </text>
  );
}