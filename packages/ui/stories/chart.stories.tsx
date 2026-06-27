import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import { expect, waitFor } from "storybook/test";

import type { ChartConfig } from "#/components/chart";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "#/components/chart";

import preview from "../.storybook/preview";

/**
 * Chart — a COMPOSITE theming wrapper around Recharts. The root `ChartContainer`
 * is layout-only (its meaningful input is a `config` object + Recharts children,
 * not enum/boolean/number props), so it exposes NO Controls; stories differ only
 * by flat toggles that drive a single shared render. Content is authored for
 * Storybook against the component's own public API, NOT synced with the apps/web
 * registry.
 */
interface ChartArgs {
  multiSeries: boolean;
  showLegend: boolean;
}

const meta = preview.type<{ args: ChartArgs }>().meta({
  args: { multiSeries: true, showLegend: false },
  argTypes: {
    multiSeries: { control: "boolean" },
    showLegend: { control: "boolean" },
  },
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
  subcomponents: { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent },
  title: "Display/Chart",
});

const chartData = [
  { desktop: 186, mobile: 80, month: "January" },
  { desktop: 305, mobile: 200, month: "February" },
  { desktop: 237, mobile: 120, month: "March" },
  { desktop: 73, mobile: 190, month: "April" },
  { desktop: 209, mobile: 130, month: "May" },
  { desktop: 214, mobile: 140, month: "June" },
];

const singleConfig = {
  desktop: { color: "#2563eb", label: "Desktop" },
} satisfies ChartConfig;

const multiConfig = {
  desktop: { color: "#2563eb", label: "Desktop" },
  mobile: { color: "#60a5fa", label: "Mobile" },
} satisfies ChartConfig;

export const Default = meta.story({
  render: ({ multiSeries, showLegend }) => (
    <div className="h-72 w-md">
      <ChartContainer className="min-h-50 w-full" config={multiSeries ? multiConfig : singleConfig}>
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
          {showLegend ? <ChartLegend content={<ChartLegendContent />} /> : null}
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          {multiSeries ? <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} /> : null}
        </BarChart>
      </ChartContainer>
    </div>
  ),
});

export const SingleSeries = meta.story({
  args: { multiSeries: false },
  render: Default.input.render,
});

export const WithLegend = meta.story({
  args: { showLegend: true },
  render: Default.input.render,
});

WithLegend.test("renders a legend entry per configured series", async ({ canvas }) => {
  // The Recharts legend content is driven by the ChartConfig labels.
  await waitFor(async () => {
    await expect(canvas.getByText("Desktop")).toBeInTheDocument();
    await expect(canvas.getByText("Mobile")).toBeInTheDocument();
  });
});
