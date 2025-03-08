import type { Registry } from '@/scripts/lib/schema';

export const charts: Registry['items'] = [
  // Area Charts
  {
    name: 'chart-area-axes',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-default',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-gradient',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-icons',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-interactive',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-legend',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-linear',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-stacked-expand',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-stacked',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  {
    name: 'chart-area-step',
    type: 'registry:block',
    categories: ['charts', 'charts-area'],
  },
  // Bar Charts
  {
    name: 'chart-bar-active',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-default',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-horizontal',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-interactive',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-label-custom',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-label',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-mixed',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-multiple',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-negative',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  {
    name: 'chart-bar-stacked',
    type: 'registry:block',
    categories: ['charts', 'charts-bar'],
  },
  // Line Charts
  {
    name: 'chart-line-default',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-dots-colors',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-dots-custom',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-dots',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-interactive',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-label-custom',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-label',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-linear',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-multiple',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  {
    name: 'chart-line-step',
    type: 'registry:block',
    categories: ['charts', 'charts-line'],
  },
  // Pie Charts
  {
    name: 'chart-pie-donut-active',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-donut-text',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-donut',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-interactive',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-label-custom',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-label-list',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-label',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-legend',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-separator-none',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-simple',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  {
    name: 'chart-pie-stacked',
    type: 'registry:block',
    categories: ['charts', 'charts-pie'],
  },
  // Radar Charts
  {
    name: 'chart-radar-default',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-dots',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-grid-circle-fill',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-grid-circle-no-lines',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-grid-circle',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-grid-custom',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-grid-fill',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-grid-none',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-icons',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-label-custom',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-legend',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-lines-only',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-multiple',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  {
    name: 'chart-radar-radius',
    type: 'registry:block',
    categories: ['charts', 'charts-radar'],
  },
  // Radial Charts
  {
    name: 'chart-radial-grid',
    type: 'registry:block',
    categories: ['charts', 'charts-radial'],
  },
  {
    name: 'chart-radial-label',
    type: 'registry:block',
    categories: ['charts', 'charts-radial'],
  },
  {
    name: 'chart-radial-shape',
    type: 'registry:block',
    categories: ['charts', 'charts-radial'],
  },
  {
    name: 'chart-radial-simple',
    type: 'registry:block',
    categories: ['charts', 'charts-radial'],
  },
  {
    name: 'chart-radial-stacked',
    type: 'registry:block',
    categories: ['charts', 'charts-radial'],
  },
  {
    name: 'chart-radial-text',
    type: 'registry:block',
    categories: ['charts', 'charts-radial'],
  },
  {
    name: 'chart-tooltip-default',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-indicator-line',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-indicator-none',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-label-none',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-label-custom',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-label-formatter',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-formatter',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-icons',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
  {
    name: 'chart-tooltip-advanced',
    type: 'registry:block',
    categories: ['charts', 'charts-tooltip'],
  },
];
