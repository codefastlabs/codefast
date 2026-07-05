import type { ComponentProps } from "react";
import { Suspense } from "react";

import { DocSection } from "#/components/detail/doc-section";
import { ExampleLive } from "#/components/detail/example-live";
import { ExamplePreview } from "#/components/detail/example-preview";
import type { ResolvedDocExample } from "#/registry/_core/types";

interface ExamplesSectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  /** Examples with their source already resolved to raw text + Shiki HTML. */
  readonly examples: ReadonlyArray<ResolvedDocExample>;
  /** Show the generic hint line when the page has no rich doc. */
  readonly showHint: boolean;
}

/** The "Examples" section: a live preview + copy-ready source per example. */
export function ExamplesSection({ examples, showHint, ...props }: ExamplesSectionProps) {
  return (
    <DocSection
      id="examples"
      title="Examples"
      description={showHint ? "Live preview and copy-ready source. Explore more variants in your own app." : undefined}
      {...props}
    >
      <div className="space-y-10">
        {examples.map((example) => (
          <ExamplePreview
            key={example.id}
            id={example.id}
            title={example.title}
            description={example.description}
            code={example.code}
            highlightedCode={example.html}
            previewClassName={example.previewClassName}
            direction={example.direction}
          >
            {/* Synchronous after a client nav; the boundary only catches the SSR-hydration lazy path. */}
            <Suspense fallback={null}>
              <ExampleLive source={example.source} />
            </Suspense>
          </ExamplePreview>
        ))}
      </div>
    </DocSection>
  );
}
