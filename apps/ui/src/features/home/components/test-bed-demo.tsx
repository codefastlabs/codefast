import { TestBed } from "@codefast/di-testing";
import { Button } from "@codefast/ui/button";
import { CheckIcon, PlayIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";

import { OrderProcessor, PaymentGatewayToken } from "#/features/home/demos/order-processor";

type TestBedDemoProps = Omit<ComponentProps<"div">, "children">;

/** Runs the sample beside it for real: a solitary bed, one call on the unit, the recorded mock call. */
export function TestBedDemo(props: TestBedDemoProps) {
  const [calls, setCalls] = useState<ReadonlyArray<ReadonlyArray<unknown>> | null>(null);

  const run = (): void => {
    const { unit, mocks } = TestBed.solitary(OrderProcessor).compile();

    unit.placeOrder("u1", 42);
    setCalls(mocks.get(PaymentGatewayToken).charge.mock.calls);
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-ui-border/60 bg-ui-card p-5" {...props}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ui-fg">Run it in this tab</p>
        <Button size="sm" onClick={run}>
          <PlayIcon className="size-3.5" />
          Run test
        </Button>
      </div>
      {calls === null ? (
        <p className="font-mono text-xs leading-relaxed text-ui-muted">
          TestBed.solitary(OrderProcessor).compile() builds the unit through a real container and auto-mocks the
          gateway.
        </p>
      ) : (
        <div className="flex flex-col gap-2 font-mono text-xs leading-relaxed">
          <p className="flex items-center gap-1.5 text-sky-700 dark:text-sky-400">
            <CheckIcon className="size-3.5" />
            charges the gateway
          </p>
          <p className="text-ui-muted">mocks.get(PaymentGatewayToken).charge.mock.calls</p>
          <pre className="overflow-x-auto rounded-xl bg-ui-surface p-3 text-ui-fg">{JSON.stringify(calls)}</pre>
        </div>
      )}
    </div>
  );
}
