import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";

import type { ChartConfig } from "#/components/chart";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "#/components/chart";

import preview from "../.storybook/preview";

const meta = preview.meta({
  component: ChartContainer,
  subcomponents: { ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent },
  parameters: {
    docs: {
      description: {
        component: [
          "A theming and layout wrapper around Recharts that wires a `config` into CSS variables and tooltips.",
          "",
          "**Anatomy:** `ChartContainer > (Recharts chart + ChartTooltip > ChartTooltipContent + ChartLegend > ChartLegendContent)`.",
          "Pass a `ChartConfig` (label + color per series); the container injects per-series CSS vars consumed by the chart.",
        ].join("\n"),
      },
    },
  },
  title: "Display/Chart",
});

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
];

const singleConfig = {
  desktop: { label: "Desktop", color: "#2563eb" },
} satisfies ChartConfig;

const multiConfig = {
  desktop: { label: "Desktop", color: "#2563eb" },
  mobile: { label: "Mobile", color: "#60a5fa" },
} satisfies ChartConfig;

export const Default = meta.story({
  render: () => (
    <div className="h-72 w-md">
      <ChartContainer className="min-h-50 w-full" config={singleConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="month"
            tickFormatter={(value) => value.slice(0, 3)}
            tickLine={false}
            tickMargin={8}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
});

export const Tooltip = meta.story({
  render: () => (
    <div className="h-72 w-md">
      <ChartContainer className="min-h-50 w-full" config={multiConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="month"
            tickFormatter={(value) => value.slice(0, 3)}
            tickLine={false}
            tickMargin={10}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
});

export const Legend = meta.story({
  render: () => (
    <div className="h-72 w-md">
      <ChartContainer className="min-h-50 w-full" config={multiConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="month"
            tickFormatter={(value) => value.slice(0, 3)}
            tickLine={false}
            tickMargin={10}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
    </div>
  ),
});
