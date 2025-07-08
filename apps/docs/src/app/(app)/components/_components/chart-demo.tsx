import { GridWrapper } from "@/components/grid-wrapper";
import { ChartAreaDefault } from "@/registry/charts/chart-area-default";
import { ChartBarMixed } from "@/registry/charts/chart-bar-mixed";
import { ChartBarMultiple } from "@/registry/charts/chart-bar-multiple";
import { ChartLineMultiple } from "@/registry/charts/chart-line-multiple";

import type { JSX } from "react";

export function ChartDemo(): JSX.Element {
  return (
    <GridWrapper className="lg:grid-cols-2">
      <div className="">
        <ChartAreaDefault />
      </div>
      <div className="">
        <ChartBarMultiple />
      </div>
      <div className="">
        <ChartBarMixed />
      </div>
      <div className="">
        <ChartLineMultiple />
      </div>
    </GridWrapper>
  );
}
