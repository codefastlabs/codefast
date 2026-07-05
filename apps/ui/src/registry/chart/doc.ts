import { ChartBarDemoAxis } from "#/registry/chart/example-axis.example";
import { ChartBarDemoGrid } from "#/registry/chart/example-grid.example";
import { ChartBarDemoLegend } from "#/registry/chart/example-legend.example";
import { ChartBarDemoTooltip } from "#/registry/chart/example-tooltip.example";
import { ChartExample } from "#/registry/chart/example.example";
import { ChartRtl } from "#/registry/chart/rtl.example";
import { ChartTooltipDemo } from "#/registry/chart/tooltip.example";
import { docSource } from "#/registry/source";
import type { ComponentDoc } from "#/registry/types";

export const chartDoc: ComponentDoc = {
  examples: [
    {
      id: "chart-example",
      title: "Example",
      description: "Build your chart using Recharts components and the chart container.",
      Demo: ChartExample,
      source: docSource("chart", "example"),
    },
    {
      id: "chart-example-axis",
      title: "Add an Axis",
      description: "Add an x-axis to the chart with the XAxis component.",
      Demo: ChartBarDemoAxis,
      source: docSource("chart", "example-axis"),
    },
    {
      id: "chart-example-grid",
      title: "Add a Grid",
      description: "Add a background grid with the CartesianGrid component.",
      Demo: ChartBarDemoGrid,
      source: docSource("chart", "example-grid"),
    },
    {
      id: "chart-example-legend",
      title: "Add Legend",
      description: "Add a legend with the ChartLegend and ChartLegendContent components.",
      Demo: ChartBarDemoLegend,
      source: docSource("chart", "example-legend"),
    },
    {
      id: "chart-example-tooltip",
      title: "Add Tooltip",
      description: "Add a themed tooltip with the ChartTooltip and ChartTooltipContent components.",
      Demo: ChartBarDemoTooltip,
      source: docSource("chart", "example-tooltip"),
    },
    {
      id: "chart-rtl",
      title: "RTL",
      description: "Right-to-left layout support for languages such as Arabic and Hebrew.",
      Demo: ChartRtl,
      source: docSource("chart", "rtl"),
      direction: "rtl",
    },
    {
      id: "chart-tooltip",
      title: "Tooltip",
      description:
        "A chart tooltip contains a label, name, indicator and value. Combine them to customize your tooltip.",
      Demo: ChartTooltipDemo,
      source: docSource("chart", "tooltip"),
    },
  ],
  features: [
    "ChartConfig maps each data series to a label and either a flat color or a light/dark theme pair, exposed as --color-<key> CSS variables Recharts components reference directly.",
    "ChartTooltipContent/ChartLegendContent are drop-in replacements for Recharts' own tooltip and legend that read colors and labels from that same config.",
    "Works with any Recharts chart type (Bar/Line/Area/Pie…) — ChartContainer only supplies the responsive wrapper and theme variables.",
  ],
  anatomy: [{ name: "ChartContainer", children: [{ name: "ChartTooltip" }] }],
  api: [
    {
      name: "ChartContainer",
      description: "Wraps a Recharts chart and supplies CSS variables from config.",
      props: [
        {
          name: "config",
          type: "ChartConfig",
          description: "Maps each series key to a label and colour (exposed as --color-<key>).",
        },
        {
          name: "children",
          type: "ReactNode",
          description: "Any Recharts chart (BarChart, LineChart, AreaChart…).",
        },
      ],
    },
    {
      name: "ChartTooltip / ChartTooltipContent",
      props: [
        {
          name: "content",
          type: "ReactNode",
          description: "Pass <ChartTooltipContent /> for themed, config-aware tooltips.",
        },
      ],
    },
  ],
  accessibility: {
    notes: [
      "Set accessibilityLayer on the Recharts chart for keyboard and screen-reader support.",
      "Pair charts with a caption or table — don’t rely on visuals alone for key numbers.",
      "Use distinct colours and labels, not colour alone, to tell series apart.",
    ],
  },
  guidelines: {
    do: ["Define every series in config so colours and labels stay consistent.", "Keep axes and tooltips uncluttered."],
    dont: ["Don’t encode meaning with colour only.", "Don’t use a chart where a single number or table is clearer."],
  },
  related: ["table", "card", "progress"],
};
