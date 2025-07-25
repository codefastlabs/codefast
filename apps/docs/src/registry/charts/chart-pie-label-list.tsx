"use client";

import type { JSX } from "react";

import { TrendingUpIcon } from "lucide-react";
import { LabelList, Pie, PieChart } from "recharts";

import type { ChartConfig } from "@codefast/ui";

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

const chartData = [
  { browser: "chrome", fill: "var(--color-chrome)", visitors: 275 },
  { browser: "safari", fill: "var(--color-safari)", visitors: 200 },
  { browser: "firefox", fill: "var(--color-firefox)", visitors: 187 },
  { browser: "edge", fill: "var(--color-edge)", visitors: 173 },
  { browser: "other", fill: "var(--color-other)", visitors: 90 },
];

const chartConfig = {
  chrome: {
    color: "var(--chart-1)",
    label: "Chrome",
  },
  edge: {
    color: "var(--chart-4)",
    label: "Edge",
  },
  firefox: {
    color: "var(--chart-3)",
    label: "Firefox",
  },
  other: {
    color: "var(--chart-5)",
    label: "Other",
  },
  safari: {
    color: "var(--chart-2)",
    label: "Safari",
  },
  visitors: {
    label: "Visitors",
  },
} satisfies ChartConfig;

export function ChartPieLabelList(): JSX.Element {
  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>Pie Chart - Label List</CardTitle>
        <CardDescription>January - June 2024</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="visitors" />} />
            <Pie data={chartData} dataKey="visitors">
              <LabelList
                className="fill-background"
                dataKey="browser"
                fontSize={12}
                formatter={(value: keyof typeof chartConfig) => chartConfig[value].label}
                stroke="none"
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUpIcon className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
      </CardFooter>
    </Card>
  );
}
