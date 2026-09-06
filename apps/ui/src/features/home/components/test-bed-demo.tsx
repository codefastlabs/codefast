import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, PlayIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { useState } from "react";

import type { ShopTestResult } from "#/features/home/demos/shop-test-run";
import { runShopTests } from "#/features/home/demos/shop-test-run";
import { track } from "#/features/tracking/lib/tracking";

type TestBedDemoProps = Omit<ComponentProps<"div">, "children">;

/** Runs the sample beside it for real: four beds over the live shop's OrderService, one line of evidence per test. */
export function TestBedDemo({ className, ...props }: TestBedDemoProps) {
  const [results, setResults] = useState<ReadonlyArray<ShopTestResult> | null>(null);

  const run = (): void => {
    track("run_demo", { demo: "test-bed", action: "run", trigger: "click" });
    setResults(runShopTests());
  };

  const passed = results?.filter((result) => result.passed).length ?? 0;

  return (
    <div
      className={cn("flex flex-col gap-4 rounded-2xl border border-ui-border/60 bg-ui-card p-6", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ui-fg">Run it in this tab</p>
        <Button size="sm" onClick={run}>
          <PlayIcon className="size-3.5" />
          {results === null ? "Run tests" : "Run again"}
        </Button>
      </div>
      {results === null ? (
        <p className="font-mono text-xs leading-relaxed text-ui-muted">
          Four beds over the live OrderService. Each TestBed.solitary(OrderService).compile() builds the unit through a
          real container and mocks its five collaborators.
        </p>
      ) : (
        <>
          <ol className="flex flex-col gap-2.5 font-mono text-xs leading-relaxed" aria-label="Test results">
            {results.map((result) => (
              <li key={result.name} className="flex flex-col gap-0.5">
                <p
                  className={cn(
                    "flex items-center gap-1.5",
                    result.passed ? "text-sky-700 dark:text-sky-400" : "text-red-700 dark:text-red-400",
                  )}
                >
                  {result.passed ? (
                    <CheckIcon className="size-3.5 shrink-0" />
                  ) : (
                    <XIcon className="size-3.5 shrink-0" />
                  )}
                  {result.name}
                </p>
                <p className="ps-5 break-all text-ui-muted">{result.evidence}</p>
              </li>
            ))}
          </ol>
          <p role="status" className="font-mono text-xs text-ui-muted">
            {passed} of {results.length} passed
          </p>
        </>
      )}
    </div>
  );
}
