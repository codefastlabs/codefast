'use client';

import type { ChartConfig } from '@codefast/ui';
import type { ComponentProps, JSX } from 'react';
import type { ContentType } from 'recharts/types/component/Label';
import type { PieSectorDataItem } from 'recharts/types/polar/Pie';
import type { ActiveShape } from 'recharts/types/util/types';

import {
  Card,
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
} from '@codefast/ui';
import * as React from 'react';
import { Label, Pie, PieChart, Sector } from 'recharts';

export const description = 'An interactive pie chart';

const desktopData = [
  { desktop: 186, fill: 'var(--color-january)', month: 'january' },
  { desktop: 305, fill: 'var(--color-february)', month: 'february' },
  { desktop: 237, fill: 'var(--color-march)', month: 'march' },
  { desktop: 173, fill: 'var(--color-april)', month: 'april' },
  { desktop: 209, fill: 'var(--color-may)', month: 'may' },
];

const chartConfig = {
  april: {
    color: 'hsl(var(--color-chart-4))',
    label: 'April',
  },
  desktop: {
    label: 'Desktop',
  },
  february: {
    color: 'hsl(var(--color-chart-2))',
    label: 'February',
  },
  january: {
    color: 'hsl(var(--color-chart-1))',
    label: 'January',
  },
  march: {
    color: 'hsl(var(--color-chart-3))',
    label: 'March',
  },
  may: {
    color: 'hsl(var(--color-chart-5))',
    label: 'May',
  },
  mobile: {
    label: 'Mobile',
  },
  visitors: {
    label: 'Visitors',
  },
} satisfies ChartConfig;

type ChartPieInteractiveProps = Omit<ComponentProps<typeof Card>, 'children'>;

export function ChartPieInteractive(props: ChartPieInteractiveProps): JSX.Element {
  const id = 'pie-interactive';
  const [activeMonth, setActiveMonth] = React.useState(desktopData[0].month);

  const activeIndex = React.useMemo(
    () => desktopData.findIndex((item) => item.month === activeMonth),
    [activeMonth],
  );
  const months = React.useMemo(() => desktopData.map((item) => item.month), []);

  return (
    <Card data-chart={id} {...props}>
      <ChartStyle config={chartConfig} id={id} />
      <CardHeader className="flex-row items-start space-y-0 pb-0">
        <div className="grid gap-1">
          <CardTitle>Pie Chart - Interactive</CardTitle>
          <CardDescription>January - June 2024</CardDescription>
        </div>
        <Select value={activeMonth} onValueChange={setActiveMonth}>
          <SelectTrigger aria-label="Select a value" className="ml-auto h-7 w-[130px] pl-2.5">
            <SelectValue placeholder="Select month" />
          </SelectTrigger>
          <SelectContent align="end" className="">
            {months.map((key) => {
              const config = chartConfig[key as keyof typeof chartConfig];

              return (
                <SelectItem key={key} className="[&_span]:flex" value={key}>
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="flex h-3 w-3 shrink-0 rounded-sm"
                      style={{
                        backgroundColor: `var(--color-${key})`,
                      }}
                    />
                    {config.label}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-1 justify-center pb-0">
        <ChartContainer
          className="mx-auto aspect-square w-full max-w-[300px]"
          config={chartConfig}
          id={id}
        >
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

const activeShape: ActiveShape<PieSectorDataItem> = ({
  outerRadius = 0,
  ...props
}: PieSectorDataItem) => (
  <g>
    <Sector {...props} outerRadius={outerRadius + 10} />
    <Sector {...props} innerRadius={outerRadius + 12} outerRadius={outerRadius + 25} />
  </g>
);

const content: (activeIndex: number) => ContentType = (activeIndex) =>
  function Content({ viewBox }): JSX.Element | null {
    if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
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
