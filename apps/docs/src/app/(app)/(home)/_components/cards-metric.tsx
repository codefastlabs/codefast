"use client";

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
import type { JSX } from "react";
import { Line, LineChart } from "recharts";

const data = [
  { average: 400, today: 240 },
  { average: 300, today: 139 },
  { average: 200, today: 980 },
  { average: 278, today: 390 },
  { average: 189, today: 480 },
  { average: 239, today: 380 },
  { average: 349, today: 430 },
];

const chartConfig = {
  today: {
    label: "Today",
    color: "var(--primary)",
  },
  average: {
    label: "Average",
    color: "var(--primary)",
  },
} satisfies ChartConfig;

export function CardsMetric(): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Exercise Minutes</CardTitle>
        <CardDescription>Your exercise minutes are ahead of where you normally are.</CardDescription>
      </CardHeader>
      <CardContent className="pb-4">
        <ChartContainer className="w-full md:h-[200px]" config={chartConfig}>
          <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line
              activeDot={{ r: 6, fill: "var(--color-average)" }}
              dataKey="average"
              stroke="var(--color-average)"
              strokeOpacity={0.5}
              strokeWidth={2}
              type="monotone"
            />
            <Line
              activeDot={{ r: 8, style: { fill: "var(--color-today)" } }}
              dataKey="today"
              stroke="var(--color-today)"
              strokeWidth={2}
              type="monotone"
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
