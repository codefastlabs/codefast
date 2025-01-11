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
import { Bar, BarChart, CartesianGrid, Cell, LabelList } from 'recharts';

export const description = 'A bar chart with negative values';

const chartData = [
  { month: 'January', visitors: 186 },
  { month: 'February', visitors: 205 },
  { month: 'March', visitors: -207 },
  { month: 'April', visitors: 173 },
  { month: 'May', visitors: -209 },
  { month: 'June', visitors: 214 },
];

const chartConfig = {
  visitors: {
    label: 'Visitors',
  },
} satisfies ChartConfig;

export function ChartBarNegative(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Bar Chart - Negative</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <ChartTooltip
              content={<ChartTooltipContent hideIndicator hideLabel />}
              cursor={false}
            />
            <Bar dataKey="visitors">
              <LabelList dataKey="month" fillOpacity={1} position="top" />
              {chartData.map((item) => (
                <Cell
                  key={item.month}
                  fill={item.visitors > 0 ? 'var(--color-chart-1)' : 'var(--color-chart-2)'}
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
