import { Button } from "@codefast/ui/button";
import { Link } from "@tanstack/react-router";
import type { ComponentProps } from "react";

import { SectionHeader } from "#/components/shared/section-header";
import { SnippetCard } from "#/features/home/components/snippet-card";

interface DiTestingSectionProps extends Omit<ComponentProps<"section">, "children"> {
  /** The `@codefast/di-testing` unit test as dual-theme highlighted HTML, from the route loader. */
  readonly testBedHtml: string;
}

/** The flagship's second half: a unit test over a real container, with every collaborator mocked for you. */
export function DiTestingSection({ testBedHtml, ...props }: DiTestingSectionProps) {
  return (
    <section aria-labelledby="home-testing-title" className="border-t border-ui-border/60 py-24 sm:py-32" {...props}>
      <div className="container mx-auto px-4">
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,34rem)] lg:gap-16">
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
              description="@codefast/di-testing reads a class's declared dependencies and builds a mock for each — no per-collaborator bind. The unit is constructed through a real container, so accessor injection and lifecycle hooks run exactly as in production. Use the built-in spy, as here, or pass vi.fn or jest.fn and assert with their matchers."
              className="mb-8"
            />
            <Button asChild variant="outline" size="lg">
              <Link to="/docs/$pkg" params={{ pkg: "di-testing" }}>
                Read about the test beds
              </Link>
            </Button>
          </div>
          <div className="reveal-up">
            <SnippetCard label="Unit test" caption="@codefast/di-testing" highlightedCode={testBedHtml} />
          </div>
        </div>
      </div>
    </section>
  );
}
