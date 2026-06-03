import type { ComponentDoc } from "#/components/examples/docs/types";
import { chartAnatomyCode, chartBarCode } from "#/components/examples/codes";
import { ChartBar } from "#/components/examples/docs/chart/bar";

export const chartDoc: ComponentDoc = {
  examples: [
    {
      id: "bar",
      title: "Bar chart",
      description: "A Recharts chart wrapped with consistent theming, tooltip, and config.",
      Demo: ChartBar,
      code: chartBarCode,
    },
  ],
  anatomy: chartAnatomyCode,
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
    do: [
      "Define every series in config so colours and labels stay consistent.",
      "Keep axes and tooltips uncluttered.",
    ],
    dont: [
      "Don’t encode meaning with colour only.",
      "Don’t use a chart where a single number or table is clearer.",
    ],
  },
  related: ["table", "card", "progress"],
};
