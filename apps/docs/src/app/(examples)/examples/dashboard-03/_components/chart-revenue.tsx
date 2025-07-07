"use client";

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
} from "@codefast/ui";
import { TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

import type { ChartConfig } from "@codefast/ui";
import type { JSX } from "react";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 346, mobile: 140 },
  { month: "July", desktop: 321, mobile: 275 },
  { month: "August", desktop: 132, mobile: 95 },
  { month: "September", desktop: 189, mobile: 225 },
  { month: "October", desktop: 302, mobile: 248 },
  { month: "November", desktop: 342, mobile: 285 },
  { month: "December", desktop: 328, mobile: 290 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
  mobile: {
    label: "Mobile",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

export function ChartRevenue(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardDescription>January - June 2024</CardDescription>
        <CardTitle className="text-3xl font-bold tracking-tight">$45,231.89</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer className="aspect-[3/1]" config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{
              left: -16,
              right: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="month"
              tickFormatter={(value: string) => value.slice(0, 3)}
              tickLine={false}
              tickMargin={10}
            />
            <YAxis
              axisLine={false}
              domain={[0, "dataMax"]}
              tickFormatter={(value: string) => value.toLocaleString()}
              tickLine={false}
              tickMargin={10}
            />
            <ChartTooltip content={<ChartTooltipContent hideIndicator />} cursor={false} />
            <Bar dataKey="desktop" fill="var(--color-desktop)" radius={[0, 0, 4, 4]} stackId={1} />
            <Bar dataKey="mobile" fill="var(--color-mobile)" radius={[4, 4, 0, 0]} stackId={1} />
          </BarChart>
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
