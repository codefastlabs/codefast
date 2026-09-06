import { Button } from "@codefast/ui/button";
import { cn } from "@codefast/ui/lib/utils";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";
import { Suspense, lazy } from "react";

import { LazyVisible } from "#/components/shared/lazy-visible";
import { PreviewSkeleton } from "#/components/shared/preview-skeleton";
import { SectionHeader } from "#/components/shared/section-header";
import { SnippetCard } from "#/features/home/components/snippet-card";

// Loaded when the section scrolls near, so @codefast/di-testing stays out of the home page's first chunk.
const TestBedDemo = lazy(() =>
  import("#/features/home/components/test-bed-demo").then((module) => ({ default: module.TestBedDemo })),
);

interface DiTestingSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** The `@codefast/di-testing` unit test as dual-theme highlighted HTML, from the route loader. */
  readonly testBedHtml: string;
}

/** The flagship's second half: a unit test over a real container, with every collaborator mocked for you. */
export function DiTestingSection({ testBedHtml, className, ...props }: DiTestingSectionProps) {
  return (
    <section
      aria-labelledby="home-testing-title"
      className={cn("border-t border-ui-border/60 py-24 sm:py-32", className)}
      {...props}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-[minmax(0,1fr)] items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-20">
          <div className="reveal-up">
            <SectionHeader
              eyebrow="Testing"
              titleId="home-testing-title"
              title={
                <>
                  Mock what
                  <br />
                  you don&rsquo;t test.
                </>
              }
              description="@codefast/di-testing reads a class's declared dependencies and builds a mock for each — no per-collaborator bind. Here the live graph's OrderService is under four tests: every collaborator auto-mocked, two of them stubbed to drive a scenario, the request context replaced by a value, and a token the unit never declared refused at compile. The unit is constructed through a real container, so accessor injection and lifecycle hooks run exactly as in production. Use the built-in spy, as here, or pass vi.fn or jest.fn and assert with their matchers."
              className="mb-10"
            />
            <Button asChild variant="outline" size="lg">
              <Link to="/docs/$pkg" params={{ pkg: "di-testing" }}>
                Read about the test beds
              </Link>
            </Button>
          </div>
          <div className="reveal-up flex flex-col gap-6">
            <SnippetCard label="Unit tests" caption="@codefast/di-testing" highlightedCode={testBedHtml} />
            <LazyVisible minHeight={148} fallback={<PreviewSkeleton minHeight={148} className="w-full rounded-2xl" />}>
              <Suspense fallback={<PreviewSkeleton minHeight={148} className="w-full rounded-2xl" />}>
                <TestBedDemo />
              </Suspense>
            </LazyVisible>
          </div>
        </div>
      </div>
    </section>
  );
}
