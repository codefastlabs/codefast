import dynamic from "next/dynamic";

import type { RegistryItem } from "@/types/registry";

export const registryCharts: Record<string, RegistryItem> = {
  "chart-area-axes": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-axes").then((module_) => module_.ChartAreaAxes),
    ),
    description: "Chart Area Axes",
    slug: "chart-area-axes",
    title: "Chart Area Axes",
  },
  "chart-area-default": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-default").then((module_) => module_.ChartAreaDefault),
    ),
    description: "Chart Area Default",
    slug: "chart-area-default",
    title: "Chart Area Default",
  },
  "chart-area-gradient": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-gradient").then((module_) => module_.ChartAreaGradient),
    ),
    description: "Chart Area Gradient",
    slug: "chart-area-gradient",
    title: "Chart Area Gradient",
  },
  "chart-area-icons": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-icons").then((module_) => module_.ChartAreaIcons),
    ),
    description: "Chart Area Icons",
    slug: "chart-area-icons",
    title: "Chart Area Icons",
  },
  "chart-area-interactive": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-interactive").then(
        (module_) => module_.ChartAreaInteractive,
      ),
    ),
    description: "Chart Area Interactive",
    slug: "chart-area-interactive",
    title: "Chart Area Interactive",
  },
  "chart-area-legend": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-legend").then((module_) => module_.ChartAreaLegend),
    ),
    description: "Chart Area Legend",
    slug: "chart-area-legend",
    title: "Chart Area Legend",
  },
  "chart-area-linear": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-linear").then((module_) => module_.ChartAreaLinear),
    ),
    description: "Chart Area Linear",
    slug: "chart-area-linear",
    title: "Chart Area Linear",
  },
  "chart-area-stacked": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-stacked").then((module_) => module_.ChartAreaStacked),
    ),
    description: "Chart Area Stacked",
    slug: "chart-area-stacked",
    title: "Chart Area Stacked",
  },
  "chart-area-stacked-expand": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-stacked-expand").then(
        (module_) => module_.ChartAreaStackedExpand,
      ),
    ),
    description: "Chart Area StackedExpand",
    slug: "chart-area-stacked-expand",
    title: "Chart Area StackedExpand",
  },
  "chart-area-step": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-area-step").then((module_) => module_.ChartAreaStep),
    ),
    description: "Chart Area Step",
    slug: "chart-area-step",
    title: "Chart Area Step",
  },
  "chart-bar-active": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-active").then((module_) => module_.ChartBarActive),
    ),
    description: "Chart Bar Active",
    slug: "chart-bar-active",
    title: "Chart Bar Active",
  },
  "chart-bar-default": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-default").then((module_) => module_.ChartBarDefault),
    ),
    description: "Chart Bar Default",
    slug: "chart-bar-default",
    title: "Chart Bar Default",
  },
  "chart-bar-horizontal": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-horizontal").then(
        (module_) => module_.ChartBarHorizontal,
      ),
    ),
    description: "Chart Bar Horizontal",
    slug: "chart-bar-horizontal",
    title: "Chart Bar Horizontal",
  },
  "chart-bar-interactive": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-interactive").then(
        (module_) => module_.ChartBarInteractive,
      ),
    ),
    description: "Chart Bar Interactive",
    slug: "chart-bar-interactive",
    title: "Chart Bar Interactive",
  },
  "chart-bar-label": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-label").then((module_) => module_.ChartBarLabel),
    ),
    description: "Chart Bar Label",
    slug: "chart-bar-label",
    title: "Chart Bar Label",
  },
  "chart-bar-label-custom": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-label-custom").then(
        (module_) => module_.ChartBarLabelCustom,
      ),
    ),
    description: "Chart Bar LabelCustom",
    slug: "chart-bar-label-custom",
    title: "Chart Bar LabelCustom",
  },
  "chart-bar-mixed": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-mixed").then((module_) => module_.ChartBarMixed),
    ),
    description: "Chart Bar Mixed",
    slug: "chart-bar-mixed",
    title: "Chart Bar Mixed",
  },
  "chart-bar-multiple": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-multiple").then((module_) => module_.ChartBarMultiple),
    ),
    description: "Chart Bar Multiple",
    slug: "chart-bar-multiple",
    title: "Chart Bar Multiple",
  },
  "chart-bar-negative": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-negative").then((module_) => module_.ChartBarNegative),
    ),
    description: "Chart Bar Negative",
    slug: "chart-bar-negative",
    title: "Chart Bar Negative",
  },
  "chart-bar-stacked": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-bar-stacked").then((module_) => module_.ChartBarStacked),
    ),
    description: "Chart Bar Stacked",
    slug: "chart-bar-stacked",
    title: "Chart Bar Stacked",
  },
  "chart-line-default": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-default").then((module_) => module_.ChartLineDefault),
    ),
    description: "Chart Line Default",
    slug: "chart-line-default",
    title: "Chart Line Default",
  },
  "chart-line-dots": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-dots").then((module_) => module_.ChartLineDots),
    ),
    description: "Chart Line Dots",
    slug: "chart-line-dots",
    title: "Chart Line Dots",
  },
  "chart-line-dots-colors": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-dots-colors").then(
        (module_) => module_.ChartLineDotsColors,
      ),
    ),
    description: "Chart Line DotsColors",
    slug: "chart-line-dots-colors",
    title: "Chart Line DotsColors",
  },
  "chart-line-dots-custom": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-dots-custom").then(
        (module_) => module_.ChartLineDotsCustom,
      ),
    ),
    description: "Chart Line DotsCustom",
    slug: "chart-line-dots-custom",
    title: "Chart Line DotsCustom",
  },
  "chart-line-interactive": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-interactive").then(
        (module_) => module_.ChartLineInteractive,
      ),
    ),
    description: "Chart Line Interactive",
    slug: "chart-line-interactive",
    title: "Chart Line Interactive",
  },
  "chart-line-label": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-label").then((module_) => module_.ChartLineLabel),
    ),
    description: "Chart Line Label",
    slug: "chart-line-label",
    title: "Chart Line Label",
  },
  "chart-line-label-custom": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-label-custom").then(
        (module_) => module_.ChartLineLabelCustom,
      ),
    ),
    description: "Chart Line LabelCustom",
    slug: "chart-line-label-custom",
    title: "Chart Line LabelCustom",
  },
  "chart-line-linear": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-linear").then((module_) => module_.ChartLineLinear),
    ),
    description: "Chart Line Linear",
    slug: "chart-line-linear",
    title: "Chart Line Linear",
  },
  "chart-line-multiple": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-multiple").then((module_) => module_.ChartLineMultiple),
    ),
    description: "Chart Line Multiple",
    slug: "chart-line-multiple",
    title: "Chart Line Multiple",
  },
  "chart-line-step": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-line-step").then((module_) => module_.ChartLineStep),
    ),
    description: "Chart Line Step",
    slug: "chart-line-step",
    title: "Chart Line Step",
  },
  "chart-pie-donut": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-donut").then((module_) => module_.ChartPieDonut),
    ),
    description: "Chart Pie Donut ",
    slug: "chart-pie-donut",
    title: "Chart Pie Donut ",
  },
  "chart-pie-donut-active": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-donut-active").then(
        (module_) => module_.ChartPieDonutActive,
      ),
    ),
    description: "Chart Pie Donut Active",
    slug: "chart-pie-donut-active",
    title: "Chart Pie Donut Active",
  },
  "chart-pie-donut-text": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-donut-text").then((module_) => module_.ChartPieDonutText),
    ),
    description: "Chart Pie Donut Text",
    slug: "chart-pie-donut-text",
    title: "Chart Pie Donut Text",
  },
  "chart-pie-interactive": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-interactive").then(
        (module_) => module_.ChartPieInteractive,
      ),
    ),
    description: "Chart Pie Interactive",
    slug: "chart-pie-interactive",
    title: "Chart Pie Interactive",
  },
  "chart-pie-label": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-label").then((module_) => module_.ChartPieLabel),
    ),
    description: "Chart Pie Label ",
    slug: "chart-pie-label",
    title: "Chart Pie Label ",
  },
  "chart-pie-label-custom": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-label-custom").then(
        (module_) => module_.ChartPieLabelCustom,
      ),
    ),
    description: "Chart Pie Label Custom",
    slug: "chart-pie-label-custom",
    title: "Chart Pie Label Custom",
  },
  "chart-pie-label-list": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-label-list").then((module_) => module_.ChartPieLabelList),
    ),
    description: "Chart Pie Label List",
    slug: "chart-pie-label-list",
    title: "Chart Pie Label List",
  },
  "chart-pie-legend": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-legend").then((module_) => module_.ChartPieLegend),
    ),
    description: "Chart Pie Legend",
    slug: "chart-pie-legend",
    title: "Chart Pie Legend",
  },
  "chart-pie-separator-none": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-separator-none").then(
        (module_) => module_.ChartPieSeparatorNone,
      ),
    ),
    description: "Chart Pie Separator None",
    slug: "chart-pie-separator-none",
    title: "Chart Pie Separator None",
  },
  "chart-pie-simple": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-simple").then((module_) => module_.ChartPieSimple),
    ),
    description: "Chart Pie Simple",
    slug: "chart-pie-simple",
    title: "Chart Pie Simple",
  },
  "chart-pie-stacked": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-pie-stacked").then((module_) => module_.ChartPieStacked),
    ),
    description: "Chart Pie Stacked",
    slug: "chart-pie-stacked",
    title: "Chart Pie Stacked",
  },
  "chart-radar-default": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-default").then((module_) => module_.ChartRadarDefault),
    ),
    description: "Chart Radar Default",
    slug: "chart-radar-default",
    title: "Chart Radar Default",
  },
  "chart-radar-dots": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-dots").then((module_) => module_.ChartRadarDots),
    ),
    description: "Chart Radar Dots",
    slug: "chart-radar-dots",
    title: "Chart Radar Dots",
  },
  "chart-radar-grid-circle": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-grid-circle").then(
        (module_) => module_.ChartRadarGridCircle,
      ),
    ),
    description: "Chart Radar Grid Circle ",
    slug: "chart-radar-grid-circle",
    title: "Chart Radar Grid Circle ",
  },
  "chart-radar-grid-circle-fill": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-grid-circle-fill").then(
        (module_) => module_.ChartRadarGridCircleFill,
      ),
    ),
    description: "Chart Radar Grid Circle Fill",
    slug: "chart-radar-grid-circle-fill",
    title: "Chart Radar Grid Circle Fill",
  },
  "chart-radar-grid-circle-no-lines": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-grid-circle-no-lines").then(
        (module_) => module_.ChartRadarGridCircleNoLines,
      ),
    ),
    description: "Chart Radar Grid Circle NoLines",
    slug: "chart-radar-grid-circle-no-lines",
    title: "Chart Radar Grid Circle NoLines",
  },
  "chart-radar-grid-custom": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-grid-custom").then(
        (module_) => module_.ChartRadarGridCustom,
      ),
    ),
    description: "Chart Radar Grid Custom",
    slug: "chart-radar-grid-custom",
    title: "Chart Radar Grid Custom",
  },
  "chart-radar-grid-fill": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-grid-fill").then(
        (module_) => module_.ChartRadarGridFill,
      ),
    ),
    description: "Chart Radar Grid Fill",
    slug: "chart-radar-grid-fill",
    title: "Chart Radar Grid Fill",
  },
  "chart-radar-grid-none": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-grid-none").then(
        (module_) => module_.ChartRadarGridNone,
      ),
    ),
    description: "Chart Radar Grid None",
    slug: "chart-radar-grid-none",
    title: "Chart Radar Grid None",
  },
  "chart-radar-icons": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-icons").then((module_) => module_.ChartRadarIcons),
    ),
    description: "Chart Radar Icons",
    slug: "chart-radar-icons",
    title: "Chart Radar Icons",
  },
  "chart-radar-label-custom": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-label-custom").then(
        (module_) => module_.ChartRadarLabelCustom,
      ),
    ),
    description: "Chart Radar Label Custom",
    slug: "chart-radar-label-custom",
    title: "Chart Radar Label Custom",
  },
  "chart-radar-legend": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-legend").then((module_) => module_.ChartRadarLegend),
    ),
    description: "Chart Radar Legend",
    slug: "chart-radar-legend",
    title: "Chart Radar Legend",
  },
  "chart-radar-lines-only": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-lines-only").then(
        (module_) => module_.ChartRadarLinesOnly,
      ),
    ),
    description: "Chart Radar Lines Only",
    slug: "chart-radar-lines-only",
    title: "Chart Radar Lines Only",
  },
  "chart-radar-multiple": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-multiple").then(
        (module_) => module_.ChartRadarMultiple,
      ),
    ),
    description: "Chart Radar Multiple",
    slug: "chart-radar-multiple",
    title: "Chart Radar Multiple",
  },
  "chart-radar-radius": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radar-radius").then((module_) => module_.ChartRadarRadius),
    ),
    description: "Chart Radar Radius",
    slug: "chart-radar-radius",
    title: "Chart Radar Radius",
  },
  "chart-radial-grid": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radial-grid").then((module_) => module_.ChartRadialGrid),
    ),
    description: "Chart Radial Grid",
    slug: "chart-radial-grid",
    title: "Chart Radial Grid",
  },
  "chart-radial-label": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radial-label").then((module_) => module_.ChartRadialLabel),
    ),
    description: "Chart Radial Label",
    slug: "chart-radial-label",
    title: "Chart Radial Label",
  },
  "chart-radial-shape": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radial-shape").then((module_) => module_.ChartRadialShape),
    ),
    description: "Chart Radial Shape",
    slug: "chart-radial-shape",
    title: "Chart Radial Shape",
  },
  "chart-radial-simple": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radial-simple").then((module_) => module_.ChartRadialSimple),
    ),
    description: "Chart Radial Simple",
    slug: "chart-radial-simple",
    title: "Chart Radial Simple",
  },
  "chart-radial-stacked": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radial-stacked").then(
        (module_) => module_.ChartRadialStacked,
      ),
    ),
    description: "Chart Radial Stacked",
    slug: "chart-radial-stacked",
    title: "Chart Radial Stacked",
  },
  "chart-radial-text": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-radial-text").then((module_) => module_.ChartRadialText),
    ),
    description: "Chart Radial Text",
    slug: "chart-radial-text",
    title: "Chart Radial Text",
  },
  "chart-tooltip-advanced": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-advanced").then(
        (module_) => module_.ChartTooltipAdvanced,
      ),
    ),
    description: "Chart Tooltip Advanced",
    slug: "chart-tooltip-advanced",
    title: "Chart Tooltip Advanced",
  },
  "chart-tooltip-default": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-default").then(
        (module_) => module_.ChartTooltipDefault,
      ),
    ),
    description: "Chart Tooltip Default",
    slug: "chart-tooltip-default",
    title: "Chart Tooltip Default",
  },
  "chart-tooltip-formatter": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-formatter").then(
        (module_) => module_.ChartTooltipFormatter,
      ),
    ),
    description: "Chart Tooltip Formatter",
    slug: "chart-tooltip-formatter",
    title: "Chart Tooltip Formatter",
  },
  "chart-tooltip-icons": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-icons").then((module_) => module_.ChartTooltipIcons),
    ),
    description: "Chart Tooltip Icons",
    slug: "chart-tooltip-icons",
    title: "Chart Tooltip Icons",
  },
  "chart-tooltip-indicator-line": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-indicator-line").then(
        (module_) => module_.ChartTooltipIndicatorLine,
      ),
    ),
    description: "Chart Tooltip Indicator Line",
    slug: "chart-tooltip-indicator-line",
    title: "Chart Tooltip Indicator Line",
  },
  "chart-tooltip-indicator-none": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-indicator-none").then(
        (module_) => module_.ChartTooltipIndicatorNone,
      ),
    ),
    description: "Chart Tooltip Indicator None",
    slug: "chart-tooltip-indicator-none",
    title: "Chart Tooltip Indicator None",
  },
  "chart-tooltip-label-custom": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-label-custom").then(
        (module_) => module_.ChartTooltipLabelCustom,
      ),
    ),
    description: "Chart Tooltip Label Custom",
    slug: "chart-tooltip-label-custom",
    title: "Chart Tooltip Label Custom",
  },
  "chart-tooltip-label-formatter": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-label-formatter").then(
        (module_) => module_.ChartTooltipLabelFormatter,
      ),
    ),
    description: "Chart Tooltip Label Formatter",
    slug: "chart-tooltip-label-formatter",
    title: "Chart Tooltip Label Formatter",
  },
  "chart-tooltip-label-none": {
    component: dynamic(async () =>
      import("@/registry/charts/chart-tooltip-label-none").then(
        (module_) => module_.ChartTooltipLabelNone,
      ),
    ),
    description: "Chart Tooltip Label None",
    slug: "chart-tooltip-label-none",
    title: "Chart Tooltip Label None",
  },
};
