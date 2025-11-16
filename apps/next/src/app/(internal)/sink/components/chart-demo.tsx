import { ChartAreaDemo } from "@/app/(internal)/sink/components/chart-area-demo";
import { ChartBarDemo } from "@/app/(internal)/sink/components/chart-bar-demo";
import { ChartBarMixed } from "@/app/(internal)/sink/components/chart-bar-mixed";
import { ChartLineDemo } from "@/app/(internal)/sink/components/chart-line-demo";

export function ChartDemo() {
  return (
    <div className="grid w-full max-w-screen-2xl gap-4 *:data-[slot=card]:flex-1 @2xl:grid-cols-2 @6xl:grid-cols-3">
      <ChartAreaDemo />
      <ChartBarDemo />
      <ChartBarMixed />
      <div className="@6xl:hidden">
        <ChartLineDemo />
      </div>
    </div>
  );
}
