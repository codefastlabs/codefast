"use client";

import type { JSX } from "react";

import { Bar, BarChart, XAxis } from "recharts";

import type { ChartConfig } from "@codefast/ui";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@codefast/ui";

const chartData = [
  { date: "2024-07-15", running: 450, swimming: 300 },
  { date: "2024-07-16", running: 380, swimming: 420 },
  { date: "2024-07-17", running: 520, swimming: 120 },
  { date: "2024-07-18", running: 140, swimming: 550 },
  { date: "2024-07-19", running: 600, swimming: 350 },
  { date: "2024-07-20", running: 480, swimming: 400 },
];

const chartConfig = {
  running: {
    color: "var(--chart-1)",
    label: "Running",
  },
  swimming: {
    color: "var(--chart-2)",
    label: "Swimming",
  },
} satisfies ChartConfig;

export function ChartTooltipIndicatorNone(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tooltip - No Indicator</CardTitle>
        <CardDescription>Tooltip with no indicator.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={chartData}>
            <XAxis
              axisLine={false}
              dataKey="date"
              tickFormatter={(value: string) => {
                return new Date(value).toLocaleDateString("en-US", {
                  weekday: "short",
                });
              }}
              tickLine={false}
              tickMargin={10}
            />
            <Bar dataKey="running" fill="var(--color-running)" radius={[0, 0, 4, 4]} stackId="a" />
            <Bar
              dataKey="swimming"
              fill="var(--color-swimming)"
              radius={[4, 4, 0, 0]}
              stackId="a"
            />
            <ChartTooltip
              content={<ChartTooltipContent hideIndicator />}
              cursor={false}
              defaultIndex={1}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
