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
} from '@codefast/ui';
import { TrendingUp } from 'lucide-react';
import { type JSX } from 'react';
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from 'recharts';
import { type ContentType } from 'recharts/types/component/Label';

export const description = 'A radial chart with a custom shape';

const chartData = [{ browser: 'safari', visitors: 1260, fill: 'var(--color-safari)' }];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
  safari: {
    label: 'Safari',
    color: 'hsl(var(--chart-2))',
  },
} satisfies ChartConfig;

export function ChartRadialShape(): JSX.Element {
  return (
    <Card>
      <CardHeader className="items-center pb-0">
        <CardTitle>Radial Chart - Shape</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer className="mx-auto aspect-square max-h-[250px]" config={chartConfig}>
          <RadialBarChart data={chartData} endAngle={100} innerRadius={80} outerRadius={140}>
            <PolarGrid
              className="first:fill-muted last:fill-background"
              gridType="circle"
              polarRadius={[86, 74]}
              radialLines={false}
              stroke="none"
            />
            <RadialBar background dataKey="visitors" />
            <PolarRadiusAxis axisLine={false} tick={false} tickLine={false}>
              <Label content={content} />
            </PolarRadiusAxis>
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
  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
    return (
      <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
        <tspan className="fill-foreground text-4xl font-bold" x={viewBox.cx} y={viewBox.cy}>
          {chartData[0].visitors.toLocaleString()}
        </tspan>
        <tspan className="fill-muted-foreground" x={viewBox.cx} y={(viewBox.cy || 0) + 24}>
          Visitors
        </tspan>
      </text>
    );
  }
};