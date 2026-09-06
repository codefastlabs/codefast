import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, PlayIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";

import type { ShopTestResult } from "#/features/home/demos/shop-test-run";
import { runShopTests } from "#/features/home/demos/shop-test-run";
import { SHOP_TESTS } from "#/features/home/demos/shop-tests";
import { track } from "#/features/tracking/lib/tracking";

interface TestBedRunnerProps extends Omit<ComponentProps<"div">, "children"> {
  /** Which test the card has open, so its evidence is the line shown. */
  readonly activeIndex: number;
}

/** The card's footer: runs the sample's four beds for real, one dot per test, and the open test's line of evidence. */
export function TestBedRunner({ activeIndex, className, ...props }: TestBedRunnerProps) {
  const [results, setResults] = useState<ReadonlyArray<ShopTestResult> | null>(null);

  const run = (): void => {
    track("run_demo", { demo: "test-bed", action: "run", trigger: "click" });
    setResults(runShopTests());
  };

  const active = results?.[activeIndex];
  const passed = results?.filter((result) => result.passed).length ?? 0;

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={run}>
            <PlayIcon className="size-3.5" />
            {results === null ? "Run all four" : "Run again"}
          </Button>
          <div aria-hidden className="flex items-center gap-1.5">
            {SHOP_TESTS.map((test, index) => {
              const result = results?.[index];

              return (
                <span
                  key={test.title}
                  className={cn(
                    "size-2 rounded-full transition-colors",
                    result === undefined ? "bg-ui-border" : result.passed ? "bg-ui-brand" : "bg-red-500",
                  )}
                />
              );
            })}
          </div>
        </div>
        <p role="status" className="font-mono text-xs text-ui-muted">
          {results === null ? "runs here, through a real container" : `${passed} of ${results.length} passed`}
        </p>
      </div>
      <p
        className={cn(
          "flex items-start gap-1.5 font-mono text-xs leading-relaxed break-all",
          active === undefined
            ? "text-ui-muted"
            : active.passed
              ? "text-sky-700 dark:text-sky-400"
              : "text-red-700 dark:text-red-400",
        )}
      >
        {active === undefined ? null : active.passed ? (
          <CheckIcon className="mt-0.5 size-3.5 shrink-0" />
        ) : (
          <XIcon className="mt-0.5 size-3.5 shrink-0" />
        )}
        <span>
          {active === undefined
            ? `${SHOP_TESTS[activeIndex]?.title ?? "this test"}: not run yet`
            : `${active.name}: ${active.evidence}`}
        </span>
      </p>
    </div>
  );
}
