import { cn } from "@codefast/tailwind-variants";
import { ChartAreaDemo } from "#/components/sink/demos/chart-area-demo";
import { ChartBarDemo } from "#/components/sink/demos/chart-bar-demo";
import { ChartBarMixedDemo } from "#/components/sink/demos/chart-bar-mixed-demo";
import { ChartLineDemo } from "#/components/sink/demos/chart-line-demo";

export function ChartDemo() {
  return (
    <div
      className={cn(
        "grid w-full max-w-screen-2xl gap-4",
        "*:data-[slot=card]:flex-1",
        "@2xl:grid-cols-2",
        "@6xl:grid-cols-3",
      )}
    >
      <ChartAreaDemo />
      <ChartBarDemo />
      <ChartBarMixedDemo />
      <div className="@6xl:hidden">
        <ChartLineDemo />
      </div>
    </div>
  );
}
