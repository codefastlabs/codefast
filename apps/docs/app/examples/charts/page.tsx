import { type Metadata } from 'next';
import { type JSX } from 'react';

import { ChartAreaAxes } from '@/app/examples/charts/_components/chart-area-axes';
import { ChartAreaDefault } from '@/app/examples/charts/_components/chart-area-default';
import { ChartAreaGradient } from '@/app/examples/charts/_components/chart-area-gradient';
import { ChartAreaIcons } from '@/app/examples/charts/_components/chart-area-icons';
import { ChartAreaInteractive } from '@/app/examples/charts/_components/chart-area-interactive';
import { ChartAreaLegend } from '@/app/examples/charts/_components/chart-area-legend';
import { ChartAreaLinear } from '@/app/examples/charts/_components/chart-area-linear';
import { ChartAreaStacked } from '@/app/examples/charts/_components/chart-area-stacked';
import { ChartAreaStackedExpand } from '@/app/examples/charts/_components/chart-area-stacked-expand';
import { ChartAreaStep } from '@/app/examples/charts/_components/chart-area-step';
import { ChartBarActive } from '@/app/examples/charts/_components/chart-bar-active';
import { ChartBarDefault } from '@/app/examples/charts/_components/chart-bar-default';
import { ChartBarHorizontal } from '@/app/examples/charts/_components/chart-bar-horizontal';
import { ChartBarInteractive } from '@/app/examples/charts/_components/chart-bar-interactive';
import { ChartBarLabel } from '@/app/examples/charts/_components/chart-bar-label';
import { ChartBarLabelCustom } from '@/app/examples/charts/_components/chart-bar-label-custom';
import { ChartBarMixed } from '@/app/examples/charts/_components/chart-bar-mixed';
import { ChartBarMultiple } from '@/app/examples/charts/_components/chart-bar-multiple';
import { ChartBarNegative } from '@/app/examples/charts/_components/chart-bar-negative';
import { ChartBarStacked } from '@/app/examples/charts/_components/chart-bar-stacked';
import { ChartLineDefault } from '@/app/examples/charts/_components/chart-line-default';
import { ChartLineDots } from '@/app/examples/charts/_components/chart-line-dots';
import { ChartLineDotsColors } from '@/app/examples/charts/_components/chart-line-dots-colors';
import { ChartLineDotsCustom } from '@/app/examples/charts/_components/chart-line-dots-custom';
import { ChartLineInteractive } from '@/app/examples/charts/_components/chart-line-interactive';
import { ChartLineLabel } from '@/app/examples/charts/_components/chart-line-label';
import { ChartLineLabelCustom } from '@/app/examples/charts/_components/chart-line-label-custom';
import { ChartLineLinear } from '@/app/examples/charts/_components/chart-line-linear';
import { ChartLineMultiple } from '@/app/examples/charts/_components/chart-line-multiple';
import { ChartLineStep } from '@/app/examples/charts/_components/chart-line-step';
import { ChartPieDonut } from '@/app/examples/charts/_components/chart-pie-donut';
import { ChartPieDonutActive } from '@/app/examples/charts/_components/chart-pie-donut-active';
import { ChartPieDonutText } from '@/app/examples/charts/_components/chart-pie-donut-text';
import { ChartPieInteractive } from '@/app/examples/charts/_components/chart-pie-interactive';
import { ChartPieLabel } from '@/app/examples/charts/_components/chart-pie-label';
import { ChartPieLabelCustom } from '@/app/examples/charts/_components/chart-pie-label-custom';
import { ChartPieLabelList } from '@/app/examples/charts/_components/chart-pie-label-list';
import { ChartPieLegend } from '@/app/examples/charts/_components/chart-pie-legend';
import { ChartPieSeparatorNone } from '@/app/examples/charts/_components/chart-pie-separator-none';
import { ChartPieSimple } from '@/app/examples/charts/_components/chart-pie-simple';
import { ChartPieStacked } from '@/app/examples/charts/_components/chart-pie-stacked';
import { ChartRadarDefault } from '@/app/examples/charts/_components/chart-radar-default';
import { ChartRadarDots } from '@/app/examples/charts/_components/chart-radar-dots';
import { ChartRadarGridCircle } from '@/app/examples/charts/_components/chart-radar-grid-circle';
import { ChartRadarGridCircleFill } from '@/app/examples/charts/_components/chart-radar-grid-circle-fill';
import { ChartRadarGridCircleNoLines } from '@/app/examples/charts/_components/chart-radar-grid-circle-no-lines';
import { ChartRadarGridCustom } from '@/app/examples/charts/_components/chart-radar-grid-custom';
import { ChartRadarGridFill } from '@/app/examples/charts/_components/chart-radar-grid-fill';
import { ChartRadarGridNone } from '@/app/examples/charts/_components/chart-radar-grid-none';
import { ChartRadarIcons } from '@/app/examples/charts/_components/chart-radar-icons';
import { ChartRadarLabelCustom } from '@/app/examples/charts/_components/chart-radar-label-custom';
import { ChartRadarLegend } from '@/app/examples/charts/_components/chart-radar-legend';
import { ChartRadarLinesOnly } from '@/app/examples/charts/_components/chart-radar-lines-only';
import { ChartRadarMultiple } from '@/app/examples/charts/_components/chart-radar-multiple';
import { ChartRadarRadius } from '@/app/examples/charts/_components/chart-radar-radius';
import { ChartRadialGrid } from '@/app/examples/charts/_components/chart-radial-grid';
import { ChartRadialLabel } from '@/app/examples/charts/_components/chart-radial-label';
import { ChartRadialShape } from '@/app/examples/charts/_components/chart-radial-shape';
import { ChartRadialSimple } from '@/app/examples/charts/_components/chart-radial-simple';
import { ChartRadialStacked } from '@/app/examples/charts/_components/chart-radial-stacked';
import { ChartRadialText } from '@/app/examples/charts/_components/chart-radial-text';
import { ChartTooltipAdvanced } from '@/app/examples/charts/_components/chart-tooltip-advanced';
import { ChartTooltipDefault } from '@/app/examples/charts/_components/chart-tooltip-default';
import { ChartTooltipFormatter } from '@/app/examples/charts/_components/chart-tooltip-formatter';
import { ChartTooltipIcons } from '@/app/examples/charts/_components/chart-tooltip-icons';
import { ChartTooltipIndicatorLine } from '@/app/examples/charts/_components/chart-tooltip-indicator-line';
import { ChartTooltipIndicatorNone } from '@/app/examples/charts/_components/chart-tooltip-indicator-none';
import { ChartTooltipLabelCustom } from '@/app/examples/charts/_components/chart-tooltip-label-custom';
import { ChartTooltipLabelFormatter } from '@/app/examples/charts/_components/chart-tooltip-label-formatter';
import { ChartTooltipLabelNone } from '@/app/examples/charts/_components/chart-tooltip-label-none';

export const metadata: Metadata = {
  title: 'Charts',
};

export default function ChartsPage(): JSX.Element {
  return (
    <main className="grid gap-4">
      <div className="grid flex-1 scroll-mt-20 gap-10 md:grid-cols-2 md:gap-6 lg:grid-cols-3 xl:gap-10">
        <ChartAreaInteractive className="col-span-full" />
        <ChartAreaAxes />
        <ChartAreaDefault />
        <ChartAreaGradient />
        <ChartAreaIcons />
        <ChartAreaLegend />
        <ChartAreaLinear />
        <ChartAreaStacked />
        <ChartAreaStackedExpand />
        <ChartAreaStep />
        <ChartBarInteractive className="col-span-full" />
        <ChartBarActive />
        <ChartBarDefault />
        <ChartBarHorizontal />
        <ChartBarLabel />
        <ChartBarLabelCustom />
        <ChartBarMixed />
        <ChartBarMultiple />
        <ChartBarNegative />
        <ChartBarStacked />
        <ChartLineInteractive className="col-span-full" />
        <ChartLineDefault />
        <ChartLineDots />
        <ChartLineDotsColors />
        <ChartLineDotsCustom />
        <ChartLineLabel />
        <ChartLineLabelCustom />
        <ChartLineLinear />
        <ChartLineMultiple />
        <ChartLineStep />
        <ChartPieInteractive className="col-span-full" />
        <ChartPieDonut />
        <ChartPieDonutActive />
        <ChartPieDonutText />
        <ChartPieLabel />
        <ChartPieLabelCustom />
        <ChartPieLabelList />
        <ChartPieLegend />
        <ChartPieSeparatorNone />
        <ChartPieSimple />
        <ChartPieStacked />
        <ChartRadarDefault />
        <ChartRadarDots />
        <ChartRadarGridCircle />
        <ChartRadarGridCircleFill />
        <ChartRadarGridCircleNoLines />
        <ChartRadarGridCustom />
        <ChartRadarGridFill />
        <ChartRadarGridNone />
        <ChartRadarIcons />
        <ChartRadarLabelCustom />
        <ChartRadarLegend />
        <ChartRadarLinesOnly />
        <ChartRadarMultiple />
        <ChartRadarRadius />
        <ChartRadialGrid />
        <ChartRadialLabel />
        <ChartRadialShape />
        <ChartRadialSimple />
        <ChartRadialStacked />
        <ChartRadialText />
        <ChartTooltipAdvanced />
        <ChartTooltipDefault />
        <ChartTooltipFormatter />
        <ChartTooltipIcons />
        <ChartTooltipIndicatorLine />
        <ChartTooltipIndicatorNone />
        <ChartTooltipLabelCustom />
        <ChartTooltipLabelFormatter />
        <ChartTooltipLabelNone />
      </div>
    </main>
  );
}
