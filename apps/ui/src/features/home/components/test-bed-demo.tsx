import { TestBed } from "@codefast/di-testing";
import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, PlayIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";

import { InventoryToken, OrderService } from "#/features/home/demos/shop";
import { track } from "#/features/tracking/lib/tracking";

type TestBedDemoProps = Omit<ComponentProps<"div">, "children">;

/** Runs the sample beside it for real: a solitary bed over the live shop's OrderService, one order, the recorded call. */
export function TestBedDemo({ className, ...props }: TestBedDemoProps) {
  const [calls, setCalls] = useState<ReadonlyArray<ReadonlyArray<unknown>> | null>(null);

  const run = (): void => {
    track("run_demo", { demo: "test-bed", action: "run", trigger: "click" });

    const { unit, mocks } = TestBed.solitary(OrderService).compile();

    unit.place("SKU-42");
    setCalls(mocks.get(InventoryToken).reserve.mock.calls);
  };

  return (
    <div
      className={cn("flex flex-col gap-4 rounded-2xl border border-ui-border/60 bg-ui-card p-6", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ui-fg">Run it in this tab</p>
        <Button size="sm" onClick={run}>
          <PlayIcon className="size-3.5" />
          Run test
        </Button>
      </div>
      {calls === null ? (
        <p className="font-mono text-xs leading-relaxed text-ui-muted">
          TestBed.solitary(OrderService).compile() builds the unit through a real container and mocks its five
          collaborators.
        </p>
      ) : (
        <div className="flex flex-col gap-2 font-mono text-xs leading-relaxed">
          <p className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
            <CheckIcon className="size-3.5" />
            reserves the stock before charging
          </p>
          <p className="text-ui-muted">mocks.get(InventoryToken).reserve.mock.calls</p>
          <pre className="overflow-x-auto rounded-xl bg-ui-surface p-3 text-ui-fg">{JSON.stringify(calls)}</pre>
        </div>
      )}
    </div>
  );
}
