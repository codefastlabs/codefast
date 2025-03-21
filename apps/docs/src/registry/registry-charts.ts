import dynamic from 'next/dynamic';

import type { Registry } from '@/types/registry';

export const registryCharts: Record<string, Registry> = {
  'chart-area-axes': {
    component: dynamic(() => import('@/registry/charts/chart-area-axes').then((mod) => mod.ChartAreaAxes)),
    description: 'Chart Area Axes',
    name: 'chart-area-axes',
    title: 'Chart Area Axes',
  },
  'chart-area-default': {
    component: dynamic(() => import('@/registry/charts/chart-area-default').then((mod) => mod.ChartAreaDefault)),
    description: 'Chart Area Default',
    name: 'chart-area-default',
    title: 'Chart Area Default',
  },
  'chart-area-gradient': {
    component: dynamic(() => import('@/registry/charts/chart-area-gradient').then((mod) => mod.ChartAreaGradient)),
    description: 'Chart Area Gradient',
    name: 'chart-area-gradient',
    title: 'Chart Area Gradient',
  },
  'chart-area-icons': {
    component: dynamic(() => import('@/registry/charts/chart-area-icons').then((mod) => mod.ChartAreaIcons)),
    description: 'Chart Area Icons',
    name: 'chart-area-icons',
    title: 'Chart Area Icons',
  },
  'chart-area-interactive': {
    component: dynamic(() =>
      import('@/registry/charts/chart-area-interactive').then((mod) => mod.ChartAreaInteractive),
    ),
    description: 'Chart Area Interactive',
    name: 'chart-area-interactive',
    title: 'Chart Area Interactive',
  },
  'chart-area-legend': {
    component: dynamic(() => import('@/registry/charts/chart-area-legend').then((mod) => mod.ChartAreaLegend)),
    description: 'Chart Area Legend',
    name: 'chart-area-legend',
    title: 'Chart Area Legend',
  },
  'chart-area-linear': {
    component: dynamic(() => import('@/registry/charts/chart-area-linear').then((mod) => mod.ChartAreaLinear)),
    description: 'Chart Area Linear',
    name: 'chart-area-linear',
    title: 'Chart Area Linear',
  },
  'chart-area-stacked': {
    component: dynamic(() => import('@/registry/charts/chart-area-stacked').then((mod) => mod.ChartAreaStacked)),
    description: 'Chart Area Stacked',
    name: 'chart-area-stacked',
    title: 'Chart Area Stacked',
  },
  'chart-area-stacked-expand': {
    component: dynamic(() =>
      import('@/registry/charts/chart-area-stacked-expand').then((mod) => mod.ChartAreaStackedExpand),
    ),
    description: 'Chart Area StackedExpand',
    name: 'chart-area-stacked-expand',
    title: 'Chart Area StackedExpand',
  },
  'chart-area-step': {
    component: dynamic(() => import('@/registry/charts/chart-area-step').then((mod) => mod.ChartAreaStep)),
    description: 'Chart Area Step',
    name: 'chart-area-step',
    title: 'Chart Area Step',
  },
  'chart-bar-active': {
    component: dynamic(() => import('@/registry/charts/chart-bar-active').then((mod) => mod.ChartBarActive)),
    description: 'Chart Bar Active',
    name: 'chart-bar-active',
    title: 'Chart Bar Active',
  },
  'chart-bar-default': {
    component: dynamic(() => import('@/registry/charts/chart-bar-default').then((mod) => mod.ChartBarDefault)),
    description: 'Chart Bar Default',
    name: 'chart-bar-default',
    title: 'Chart Bar Default',
  },
  'chart-bar-horizontal': {
    component: dynamic(() => import('@/registry/charts/chart-bar-horizontal').then((mod) => mod.ChartBarHorizontal)),
    description: 'Chart Bar Horizontal',
    name: 'chart-bar-horizontal',
    title: 'Chart Bar Horizontal',
  },
  'chart-bar-interactive': {
    component: dynamic(() => import('@/registry/charts/chart-bar-interactive').then((mod) => mod.ChartBarInteractive)),
    description: 'Chart Bar Interactive',
    name: 'chart-bar-interactive',
    title: 'Chart Bar Interactive',
  },
  'chart-bar-label': {
    component: dynamic(() => import('@/registry/charts/chart-bar-label').then((mod) => mod.ChartBarLabel)),
    description: 'Chart Bar Label',
    name: 'chart-bar-label',
    title: 'Chart Bar Label',
  },
  'chart-bar-label-custom': {
    component: dynamic(() => import('@/registry/charts/chart-bar-label-custom').then((mod) => mod.ChartBarLabelCustom)),
    description: 'Chart Bar LabelCustom',
    name: 'chart-bar-label-custom',
    title: 'Chart Bar LabelCustom',
  },
  'chart-bar-mixed': {
    component: dynamic(() => import('@/registry/charts/chart-bar-mixed').then((mod) => mod.ChartBarMixed)),
    description: 'Chart Bar Mixed',
    name: 'chart-bar-mixed',
    title: 'Chart Bar Mixed',
  },
  'chart-bar-multiple': {
    component: dynamic(() => import('@/registry/charts/chart-bar-multiple').then((mod) => mod.ChartBarMultiple)),
    description: 'Chart Bar Multiple',
    name: 'chart-bar-multiple',
    title: 'Chart Bar Multiple',
  },
  'chart-bar-negative': {
    component: dynamic(() => import('@/registry/charts/chart-bar-negative').then((mod) => mod.ChartBarNegative)),
    description: 'Chart Bar Negative',
    name: 'chart-bar-negative',
    title: 'Chart Bar Negative',
  },
  'chart-bar-stacked': {
    component: dynamic(() => import('@/registry/charts/chart-bar-stacked').then((mod) => mod.ChartBarStacked)),
    description: 'Chart Bar Stacked',
    name: 'chart-bar-stacked',
    title: 'Chart Bar Stacked',
  },
  'chart-line-default': {
    component: dynamic(() => import('@/registry/charts/chart-line-default').then((mod) => mod.ChartLineDefault)),
    description: 'Chart Line Default',
    name: 'chart-line-default',
    title: 'Chart Line Default',
  },
  'chart-line-dots': {
    component: dynamic(() => import('@/registry/charts/chart-line-dots').then((mod) => mod.ChartLineDots)),
    description: 'Chart Line Dots',
    name: 'chart-line-dots',
    title: 'Chart Line Dots',
  },
  'chart-line-dots-colors': {
    component: dynamic(() => import('@/registry/charts/chart-line-dots-colors').then((mod) => mod.ChartLineDotsColors)),
    description: 'Chart Line DotsColors',
    name: 'chart-line-dots-colors',
    title: 'Chart Line DotsColors',
  },
  'chart-line-dots-custom': {
    component: dynamic(() => import('@/registry/charts/chart-line-dots-custom').then((mod) => mod.ChartLineDotsCustom)),
    description: 'Chart Line DotsCustom',
    name: 'chart-line-dots-custom',
    title: 'Chart Line DotsCustom',
  },
  'chart-line-interactive': {
    component: dynamic(() =>
      import('@/registry/charts/chart-line-interactive').then((mod) => mod.ChartLineInteractive),
    ),
    description: 'Chart Line Interactive',
    name: 'chart-line-interactive',
    title: 'Chart Line Interactive',
  },
  'chart-line-label': {
    component: dynamic(() => import('@/registry/charts/chart-line-label').then((mod) => mod.ChartLineLabel)),
    description: 'Chart Line Label',
    name: 'chart-line-label',
    title: 'Chart Line Label',
  },
  'chart-line-label-custom': {
    component: dynamic(() =>
      import('@/registry/charts/chart-line-label-custom').then((mod) => mod.ChartLineLabelCustom),
    ),
    description: 'Chart Line LabelCustom',
    name: 'chart-line-label-custom',
    title: 'Chart Line LabelCustom',
  },
  'chart-line-linear': {
    component: dynamic(() => import('@/registry/charts/chart-line-linear').then((mod) => mod.ChartLineLinear)),
    description: 'Chart Line Linear',
    name: 'chart-line-linear',
    title: 'Chart Line Linear',
  },
  'chart-line-multiple': {
    component: dynamic(() => import('@/registry/charts/chart-line-multiple').then((mod) => mod.ChartLineMultiple)),
    description: 'Chart Line Multiple',
    name: 'chart-line-multiple',
    title: 'Chart Line Multiple',
  },
  'chart-line-step': {
    component: dynamic(() => import('@/registry/charts/chart-line-step').then((mod) => mod.ChartLineStep)),
    description: 'Chart Line Step',
    name: 'chart-line-step',
    title: 'Chart Line Step',
  },
  'chart-pie-donut': {
    component: dynamic(() => import('@/registry/charts/chart-pie-donut').then((mod) => mod.ChartPieDonut)),
    description: 'Chart Pie Donut ',
    name: 'chart-pie-donut',
    title: 'Chart Pie Donut ',
  },
  'chart-pie-donut-active': {
    component: dynamic(() => import('@/registry/charts/chart-pie-donut-active').then((mod) => mod.ChartPieDonutActive)),
    description: 'Chart Pie Donut Active',
    name: 'chart-pie-donut-active',
    title: 'Chart Pie Donut Active',
  },
  'chart-pie-donut-text': {
    component: dynamic(() => import('@/registry/charts/chart-pie-donut-text').then((mod) => mod.ChartPieDonutText)),
    description: 'Chart Pie Donut Text',
    name: 'chart-pie-donut-text',
    title: 'Chart Pie Donut Text',
  },
  'chart-pie-interactive': {
    component: dynamic(() => import('@/registry/charts/chart-pie-interactive').then((mod) => mod.ChartPieInteractive)),
    description: 'Chart Pie Interactive',
    name: 'chart-pie-interactive',
    title: 'Chart Pie Interactive',
  },
  'chart-pie-label': {
    component: dynamic(() => import('@/registry/charts/chart-pie-label').then((mod) => mod.ChartPieLabel)),
    description: 'Chart Pie Label ',
    name: 'chart-pie-label',
    title: 'Chart Pie Label ',
  },
  'chart-pie-label-custom': {
    component: dynamic(() => import('@/registry/charts/chart-pie-label-custom').then((mod) => mod.ChartPieLabelCustom)),
    description: 'Chart Pie Label Custom',
    name: 'chart-pie-label-custom',
    title: 'Chart Pie Label Custom',
  },
  'chart-pie-label-list': {
    component: dynamic(() => import('@/registry/charts/chart-pie-label-list').then((mod) => mod.ChartPieLabelList)),
    description: 'Chart Pie Label List',
    name: 'chart-pie-label-list',
    title: 'Chart Pie Label List',
  },
  'chart-pie-legend': {
    component: dynamic(() => import('@/registry/charts/chart-pie-legend').then((mod) => mod.ChartPieLegend)),
    description: 'Chart Pie Legend',
    name: 'chart-pie-legend',
    title: 'Chart Pie Legend',
  },
  'chart-pie-separator-none': {
    component: dynamic(() =>
      import('@/registry/charts/chart-pie-separator-none').then((mod) => mod.ChartPieSeparatorNone),
    ),
    description: 'Chart Pie Separator None',
    name: 'chart-pie-separator-none',
    title: 'Chart Pie Separator None',
  },
  'chart-pie-simple': {
    component: dynamic(() => import('@/registry/charts/chart-pie-simple').then((mod) => mod.ChartPieSimple)),
    description: 'Chart Pie Simple',
    name: 'chart-pie-simple',
    title: 'Chart Pie Simple',
  },
  'chart-pie-stacked': {
    component: dynamic(() => import('@/registry/charts/chart-pie-stacked').then((mod) => mod.ChartPieStacked)),
    description: 'Chart Pie Stacked',
    name: 'chart-pie-stacked',
    title: 'Chart Pie Stacked',
  },
  'chart-radar-default': {
    component: dynamic(() => import('@/registry/charts/chart-radar-default').then((mod) => mod.ChartRadarDefault)),
    description: 'Chart Radar Default',
    name: 'chart-radar-default',
    title: 'Chart Radar Default',
  },
  'chart-radar-dots': {
    component: dynamic(() => import('@/registry/charts/chart-radar-dots').then((mod) => mod.ChartRadarDots)),
    description: 'Chart Radar Dots',
    name: 'chart-radar-dots',
    title: 'Chart Radar Dots',
  },
  'chart-radar-grid-circle': {
    component: dynamic(() =>
      import('@/registry/charts/chart-radar-grid-circle').then((mod) => mod.ChartRadarGridCircle),
    ),
    description: 'Chart Radar Grid Circle ',
    name: 'chart-radar-grid-circle',
    title: 'Chart Radar Grid Circle ',
  },
  'chart-radar-grid-circle-fill': {
    component: dynamic(() =>
      import('@/registry/charts/chart-radar-grid-circle-fill').then((mod) => mod.ChartRadarGridCircleFill),
    ),
    description: 'Chart Radar Grid Circle Fill',
    name: 'chart-radar-grid-circle-fill',
    title: 'Chart Radar Grid Circle Fill',
  },
  'chart-radar-grid-circle-no-lines': {
    component: dynamic(() =>
      import('@/registry/charts/chart-radar-grid-circle-no-lines').then((mod) => mod.ChartRadarGridCircleNoLines),
    ),
    description: 'Chart Radar Grid Circle NoLines',
    name: 'chart-radar-grid-circle-no-lines',
    title: 'Chart Radar Grid Circle NoLines',
  },
  'chart-radar-grid-custom': {
    component: dynamic(() =>
      import('@/registry/charts/chart-radar-grid-custom').then((mod) => mod.ChartRadarGridCustom),
    ),
    description: 'Chart Radar Grid Custom',
    name: 'chart-radar-grid-custom',
    title: 'Chart Radar Grid Custom',
  },
  'chart-radar-grid-fill': {
    component: dynamic(() => import('@/registry/charts/chart-radar-grid-fill').then((mod) => mod.ChartRadarGridFill)),
    description: 'Chart Radar Grid Fill',
    name: 'chart-radar-grid-fill',
    title: 'Chart Radar Grid Fill',
  },
  'chart-radar-grid-none': {
    component: dynamic(() => import('@/registry/charts/chart-radar-grid-none').then((mod) => mod.ChartRadarGridNone)),
    description: 'Chart Radar Grid None',
    name: 'chart-radar-grid-none',
    title: 'Chart Radar Grid None',
  },
  'chart-radar-icons': {
    component: dynamic(() => import('@/registry/charts/chart-radar-icons').then((mod) => mod.ChartRadarIcons)),
    description: 'Chart Radar Icons',
    name: 'chart-radar-icons',
    title: 'Chart Radar Icons',
  },
  'chart-radar-label-custom': {
    component: dynamic(() =>
      import('@/registry/charts/chart-radar-label-custom').then((mod) => mod.ChartRadarLabelCustom),
    ),
    description: 'Chart Radar Label Custom',
    name: 'chart-radar-label-custom',
    title: 'Chart Radar Label Custom',
  },
  'chart-radar-legend': {
    component: dynamic(() => import('@/registry/charts/chart-radar-legend').then((mod) => mod.ChartRadarLegend)),
    description: 'Chart Radar Legend',
    name: 'chart-radar-legend',
    title: 'Chart Radar Legend',
  },
  'chart-radar-lines-only': {
    component: dynamic(() => import('@/registry/charts/chart-radar-lines-only').then((mod) => mod.ChartRadarLinesOnly)),
    description: 'Chart Radar Lines Only',
    name: 'chart-radar-lines-only',
    title: 'Chart Radar Lines Only',
  },
  'chart-radar-multiple': {
    component: dynamic(() => import('@/registry/charts/chart-radar-multiple').then((mod) => mod.ChartRadarMultiple)),
    description: 'Chart Radar Multiple',
    name: 'chart-radar-multiple',
    title: 'Chart Radar Multiple',
  },
  'chart-radar-radius': {
    component: dynamic(() => import('@/registry/charts/chart-radar-radius').then((mod) => mod.ChartRadarRadius)),
    description: 'Chart Radar Radius',
    name: 'chart-radar-radius',
    title: 'Chart Radar Radius',
  },
  'chart-radial-grid': {
    component: dynamic(() => import('@/registry/charts/chart-radial-grid').then((mod) => mod.ChartRadialGrid)),
    description: 'Chart Radial Grid',
    name: 'chart-radial-grid',
    title: 'Chart Radial Grid',
  },
  'chart-radial-label': {
    component: dynamic(() => import('@/registry/charts/chart-radial-label').then((mod) => mod.ChartRadialLabel)),
    description: 'Chart Radial Label',
    name: 'chart-radial-label',
    title: 'Chart Radial Label',
  },
  'chart-radial-shape': {
    component: dynamic(() => import('@/registry/charts/chart-radial-shape').then((mod) => mod.ChartRadialShape)),
    description: 'Chart Radial Shape',
    name: 'chart-radial-shape',
    title: 'Chart Radial Shape',
  },
  'chart-radial-simple': {
    component: dynamic(() => import('@/registry/charts/chart-radial-simple').then((mod) => mod.ChartRadialSimple)),
    description: 'Chart Radial Simple',
    name: 'chart-radial-simple',
    title: 'Chart Radial Simple',
  },
  'chart-radial-stacked': {
    component: dynamic(() => import('@/registry/charts/chart-radial-stacked').then((mod) => mod.ChartRadialStacked)),
    description: 'Chart Radial Stacked',
    name: 'chart-radial-stacked',
    title: 'Chart Radial Stacked',
  },
  'chart-radial-text': {
    component: dynamic(() => import('@/registry/charts/chart-radial-text').then((mod) => mod.ChartRadialText)),
    description: 'Chart Radial Text',
    name: 'chart-radial-text',
    title: 'Chart Radial Text',
  },
  'chart-tooltip-advanced': {
    component: dynamic(() =>
      import('@/registry/charts/chart-tooltip-advanced').then((mod) => mod.ChartTooltipAdvanced),
    ),
    description: 'Chart Tooltip Advanced',
    name: 'chart-tooltip-advanced',
    title: 'Chart Tooltip Advanced',
  },
  'chart-tooltip-default': {
    component: dynamic(() => import('@/registry/charts/chart-tooltip-default').then((mod) => mod.ChartTooltipDefault)),
    description: 'Chart Tooltip Default',
    name: 'chart-tooltip-default',
    title: 'Chart Tooltip Default',
  },
  'chart-tooltip-formatter': {
    component: dynamic(() =>
      import('@/registry/charts/chart-tooltip-formatter').then((mod) => mod.ChartTooltipFormatter),
    ),
    description: 'Chart Tooltip Formatter',
    name: 'chart-tooltip-formatter',
    title: 'Chart Tooltip Formatter',
  },
  'chart-tooltip-icons': {
    component: dynamic(() => import('@/registry/charts/chart-tooltip-icons').then((mod) => mod.ChartTooltipIcons)),
    description: 'Chart Tooltip Icons',
    name: 'chart-tooltip-icons',
    title: 'Chart Tooltip Icons',
  },
  'chart-tooltip-indicator-line': {
    component: dynamic(() =>
      import('@/registry/charts/chart-tooltip-indicator-line').then((mod) => mod.ChartTooltipIndicatorLine),
    ),
    description: 'Chart Tooltip Indicator Line',
    name: 'chart-tooltip-indicator-line',
    title: 'Chart Tooltip Indicator Line',
  },
  'chart-tooltip-indicator-none': {
    component: dynamic(() =>
      import('@/registry/charts/chart-tooltip-indicator-none').then((mod) => mod.ChartTooltipIndicatorNone),
    ),
    description: 'Chart Tooltip Indicator None',
    name: 'chart-tooltip-indicator-none',
    title: 'Chart Tooltip Indicator None',
  },
  'chart-tooltip-label-custom': {
    component: dynamic(() =>
      import('@/registry/charts/chart-tooltip-label-custom').then((mod) => mod.ChartTooltipLabelCustom),
    ),
    description: 'Chart Tooltip Label Custom',
    name: 'chart-tooltip-label-custom',
    title: 'Chart Tooltip Label Custom',
  },
  'chart-tooltip-label-formatter': {
    component: dynamic(() =>
      import('@/registry/charts/chart-tooltip-label-formatter').then((mod) => mod.ChartTooltipLabelFormatter),
    ),
    description: 'Chart Tooltip Label Formatter',
    name: 'chart-tooltip-label-formatter',
    title: 'Chart Tooltip Label Formatter',
  },
  'chart-tooltip-label-none': {
    component: dynamic(() =>
      import('@/registry/charts/chart-tooltip-label-none').then((mod) => mod.ChartTooltipLabelNone),
    ),
    description: 'Chart Tooltip Label None',
    name: 'chart-tooltip-label-none',
    title: 'Chart Tooltip Label None',
  },
};
