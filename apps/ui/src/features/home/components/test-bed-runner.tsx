import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, PlayIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useEffect, useRef, useState } from "react";

import type { ShopTestResult } from "#/features/home/demos/shop-test-run";
import { runShopTests } from "#/features/home/demos/shop-test-run";
import { SHOP_TESTS } from "#/features/home/demos/shop-tests";
import { track } from "#/features/tracking/lib/tracking";

// The beds finish in a few milliseconds, so the results are revealed one by one: a run has to be seen to be believed.
const REVEAL_STEP_MS = 160;

interface TestBedRunnerProps extends Omit<ComponentProps<"div">, "children"> {
  /** Which test the card has open, so its evidence is the line shown. */
  readonly activeIndex: number;
}

/** The card's footer: runs the sample's four beds for real, one dot per test, and the open test's line of evidence. */
export function TestBedRunner({ activeIndex, className, ...props }: TestBedRunnerProps) {
  const [results, setResults] = useState<ReadonlyArray<ShopTestResult> | null>(null);
  const [revealed, setRevealed] = useState(0);
  const [runs, setRuns] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  useEffect(
    () => () => {
      for (const timer of timers.current) {
        clearTimeout(timer);
      }
    },
    [],
  );

  const run = (): void => {
    track("run_demo", { demo: "test-bed", action: "run", trigger: "click" });

    for (const timer of timers.current) {
      clearTimeout(timer);
    }

    const startedAt = performance.now();
    const next = runShopTests();

    setElapsedMs(performance.now() - startedAt);
    setResults(next);
    setRevealed(0);
    setRuns((count) => count + 1);
    timers.current = next.map((_, index) =>
      setTimeout(
        () => {
          setRevealed(index + 1);
        },
        (index + 1) * REVEAL_STEP_MS,
      ),
    );
  };

  const running = results !== null && revealed < results.length;
  const active = results !== null && activeIndex < revealed ? results[activeIndex] : undefined;
  const passed = results?.slice(0, revealed).filter((result) => result.passed).length ?? 0;

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-3">
          <Button size="sm" onClick={run} disabled={running}>
            <PlayIcon className="size-3.5" />
            {results === null ? "Run all four" : "Run again"}
          </Button>
          <div aria-hidden className="flex items-center gap-1.5">
            {SHOP_TESTS.map((test, index) => {
              const result = index < revealed ? results?.[index] : undefined;

              return (
                <span
                  key={test.title}
                  className={cn(
                    "size-2 rounded-full transition-colors duration-300",
                    result === undefined ? "bg-ui-border" : result.passed ? "bg-ui-brand" : "bg-red-500",
                    running && result === undefined && "animate-pulse",
                  )}
                />
              );
            })}
          </div>
        </div>
        <p role="status" className="font-mono text-xs text-ui-muted tabular-nums">
          {results === null
            ? "runs here, through a real container"
            : running
              ? `running ${revealed} of ${results.length}…`
              : `${passed} of ${results.length} passed · ${elapsedMs.toFixed(1)} ms${runs > 1 ? ` · run ${runs}` : ""}`}
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
            ? `${SHOP_TESTS[activeIndex]?.title ?? "this test"}: ${running ? "running…" : "not run yet"}`
            : `${active.name}: ${active.evidence}`}
        </span>
      </p>
    </div>
  );
}
