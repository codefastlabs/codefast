"use client";

import type { ChartConfig } from "@codefast/ui";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ChartContainer,
  ChartStyle,
  ChartTooltip,
  ChartTooltipContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@codefast/ui";
import { isEmpty } from "lodash-es";
import type { JSX, ReactNode } from "react";
import { useMemo, useState } from "react";
import { Label, Pie, PieChart, Sector } from "recharts";
import type { ContentType } from "recharts/types/component/Label";
import type { PieSectorDataItem } from "recharts/types/polar/Pie";
import type { ActiveShape } from "recharts/types/util/types";

const desktopData = [
  { month: "january", desktop: 186, fill: "var(--color-january)" },
  { month: "february", desktop: 305, fill: "var(--color-february)" },
  { month: "march", desktop: 237, fill: "var(--color-march)" },
  { month: "april", desktop: 173, fill: "var(--color-april)" },
  { month: "may", desktop: 209, fill: "var(--color-may)" },
];

const chartConfig = {
  visitors: {
    label: "Visitors",
  },
  desktop: {
    label: "Desktop",
  },
  mobile: {
    label: "Mobile",
  },
  january: {
    label: "January",
    color: "var(--chart-1)",
  },
  february: {
    label: "February",
    color: "var(--chart-2)",
  },
  march: {
    label: "March",
    color: "var(--chart-3)",
  },
  april: {
    label: "April",
    color: "var(--chart-4)",
  },
  may: {
    label: "May",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

export function ChartVisitors(): JSX.Element {
  const id = "pie-interactive";
  const [activeMonth, setActiveMonth] = useState(desktopData[0].month);

  const activeIndex = useMemo(() => desktopData.findIndex((item) => item.month === activeMonth), [activeMonth]);
  const months = useMemo(() => desktopData.map((item) => item.month), []);

  return (
    <Card data-chart={id}>
      <ChartStyle config={chartConfig} id={id} />
      <CardHeader>
        <CardDescription>January - June 2024</CardDescription>
        <CardTitle className="text-2xl font-bold">1,234 visitors</CardTitle>
        <CardAction>
          <Select onValueChange={setActiveMonth} value={activeMonth}>
            <SelectTrigger aria-label="Select a value" className="ml-auto h-8 w-[120px]">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent align="end">
              {months.map((key) => {
                const config = chartConfig[key as keyof typeof chartConfig];

                if (isEmpty(config)) {
                  return null;
                }

                const color = "color" in config ? config.color : undefined;

                return (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className="flex h-3 w-3 shrink-0 rounded-sm"
                        style={{
                          backgroundColor: color,
                        }}
                      />
                      {config.label}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer className="mx-auto aspect-square w-full max-w-[300px]" config={chartConfig} id={id}>
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent hideLabel />} cursor={false} />
            <Pie
              activeIndex={activeIndex}
              activeShape={activeShape}
              data={desktopData}
              dataKey="desktop"
              innerRadius={60}
              nameKey="month"
              strokeWidth={5}
            >
              <Label content={content(activeIndex)} />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const activeShape: ActiveShape<PieSectorDataItem> = ({ outerRadius = 0, ...props }: PieSectorDataItem) => (
  <g>
    <Sector {...props} outerRadius={outerRadius + 10} />
    <Sector {...props} innerRadius={outerRadius + 12} outerRadius={outerRadius + 25} />
  </g>
);

const content: (activeIndex: number) => ContentType = (activeIndex) =>
  function Content({ viewBox }): ReactNode {
    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
      return (
        <text dominantBaseline="middle" textAnchor="middle" x={viewBox.cx} y={viewBox.cy}>
          <tspan className="fill-foreground text-3xl font-bold" x={viewBox.cx} y={viewBox.cy}>
            {desktopData[activeIndex].desktop.toLocaleString()}
          </tspan>
          <tspan className="fill-muted-foreground" x={viewBox.cx} y={(viewBox.cy ?? 0) + 24}>
            Visitors
          </tspan>
        </text>
      );
    }

    return null;
  };
