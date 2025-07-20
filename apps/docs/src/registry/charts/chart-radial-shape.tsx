"use client";

import type { JSX, ReactNode } from "react";
import type { Props } from "recharts/types/component/Label";

import { TrendingUpIcon } from "lucide-react";
import { Label, PolarGrid, PolarRadiusAxis, RadialBar, RadialBarChart } from "recharts";

import type { ChartConfig } from "@codefast/ui";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  ChartContainer,
} from "@codefast/ui";

const chartData = [{ browser: "safari", fill: "var(--color-safari)", visitors: 1260 }];

const chartConfig = {
  safari: {
    color: "var(--chart-2)",
    label: "Safari",
  },
  visitors: {
    label: "Visitors",
  },
} satisfies ChartConfig;

export function ChartRadialShape(): JSX.Element {
  return (
    <Card className="flex flex-col">
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
              <Label content={Content} />
            </PolarRadiusAxis>
          </RadialBarChart>
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

function Content({ viewBox }: Props): ReactNode {
  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
    return (
      <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
        <tspan className="fill-foreground text-4xl font-bold" x={viewBox.cx} y={viewBox.cy}>
          {chartData[0].visitors.toLocaleString()}
        </tspan>
        <tspan className="fill-muted-foreground" x={viewBox.cx} y={(viewBox.cy ?? 0) + 24}>
          Visitors
        </tspan>
      </text>
    );
  }

  return null;
}
