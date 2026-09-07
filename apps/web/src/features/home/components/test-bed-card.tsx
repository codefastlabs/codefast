import { cn } from "@codefast/ui/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import { BracesIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { Suspense, lazy, useState } from "react";

import { CodeBlock } from "#/components/shared/code-block";
import { LazyVisible } from "#/components/shared/lazy-visible";
import { PreviewSkeleton } from "#/components/shared/preview-skeleton";
import { ImportsFold } from "#/features/home/components/imports-fold";
import { SHOP_TESTS } from "#/features/home/demos/shop-tests";
import type { TestBedSnippet } from "#/features/home/lib/home-snippets";

// Loaded when the card scrolls near, so @codefast/di-testing stays out of the home page's first chunk.
const TestBedRunner = lazy(() =>
  import("#/features/home/components/test-bed-runner").then((module) => ({ default: module.TestBedRunner })),
);

interface TestBedCardProps extends Omit<ComponentProps<"div">, "children"> {
  /** The test file, split into its import block and one highlighted body per test. */
  readonly snippet: TestBedSnippet;
}

/** The tab label for a test title, from the shared list; the title itself when the list does not know it. */
function labelOf(title: string): string {
  return SHOP_TESTS.find((test) => test.title === title)?.label ?? title;
}

/** The testing sample as a tabbed card: one tab per test, the imports folded away, and the runner in the footer. */
export function TestBedCard({ snippet, className, ...props }: TestBedCardProps) {
  const [active, setActive] = useState("0");

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-2xl border border-ui-border/60 bg-ui-card shadow-2xl shadow-black/10 dark:shadow-black/40",
        className,
      )}
      {...props}
    >
      <div className="flex items-center justify-between border-b border-ui-border/60 px-6 py-4">
        <div className="flex items-center gap-2 text-xs font-semibold tracking-widest text-ui-muted uppercase">
          <BracesIcon className="size-3.5" />
          Unit tests
        </div>
        <span className="font-mono text-xs text-ui-muted">@codefast/di-testing</span>
      </div>
      <Tabs value={active} onValueChange={setActive} className="gap-0">
        <div className="border-b border-ui-border/60 px-4 py-2">
          <TabsList variant="line" className="w-full flex-wrap justify-start gap-1 group-data-horizontal/tabs:h-auto">
            {snippet.tests.map((test, index) => (
              <TabsTrigger key={test.title} value={String(index)} className="flex-none px-2.5 py-1 text-xs">
                {labelOf(test.title)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <ImportsFold
          label="imports, from ./shop and @codefast/di-testing"
          highlightedCode={snippet.imports}
          className="border-b border-ui-border/60"
        />
        {snippet.tests.map((test, index) => (
          <TabsContent key={test.title} value={String(index)}>
            <CodeBlock highlightedCode={test.html} />
          </TabsContent>
        ))}
      </Tabs>
      <div className="border-t border-ui-border/60 px-6 py-4">
        <LazyVisible minHeight={64} fallback={<PreviewSkeleton minHeight={64} className="w-full rounded-xl" />}>
          <Suspense fallback={<PreviewSkeleton minHeight={64} className="w-full rounded-xl" />}>
            <TestBedRunner activeIndex={Number(active)} />
          </Suspense>
        </LazyVisible>
      </div>
    </div>
  );
}
