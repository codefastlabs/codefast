"use client";

import { TrendingUpIcon } from "lucide-react";
import type { JSX } from "react";
import { CartesianGrid, Dot, Line, LineChart } from "recharts";
import type { DotProps } from "recharts";
import type { LineDot } from "recharts/types/cartesian/Line";

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

interface DataItem {
  browser: string;
  fill: string;
  visitors: number;
}

const chartData: DataItem[] = [
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
    color: "var(--chart-2)",
    label: "Visitors",
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
              left: 24,
              right: 24,
              top: 24,
            }}
          >
            <CartesianGrid vertical={false} />
            <ChartTooltip
              content={<ChartTooltipContent hideLabel indicator="line" nameKey="visitors" />}
              cursor={false}
            />
            <Line
              dataKey="visitors"
              dot={dot}
              stroke="var(--color-visitors)"
              strokeWidth={2}
              type="natural"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col items-start gap-2 text-sm">
        <div className="flex gap-2 font-medium leading-none">
          Trending up by 5.2% this month <TrendingUpIcon className="h-4 w-4" />
        </div>
        <div className="text-muted-foreground leading-none">
          Showing total visitors for the last 6 months
        </div>
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
  return (
    <Dot
      key={payload.browser}
      cx={props.cx}
      cy={props.cy}
      fill={payload.fill}
      r={5}
      stroke={payload.fill}
    />
  );
};
