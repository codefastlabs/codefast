import { DocSection } from "#/components/detail/doc-section";
import { ExamplePreview } from "#/components/detail/example-preview";
import type { ResolvedDocExample } from "#/registry/types";

interface ExamplesSectionProps {
  /** Examples with their source already resolved to raw text + Shiki HTML. */
  readonly examples: ReadonlyArray<ResolvedDocExample>;
  /** Show the generic hint line when the page has no rich doc. */
  readonly showHint: boolean;
}

/** The "Examples" section: a live preview + copy-ready source per example. */
export function ExamplesSection({ examples, showHint }: ExamplesSectionProps) {
  return (
    <DocSection
      id="examples"
      title="Examples"
      description={showHint ? "Live preview and copy-ready source. Explore more variants in your own app." : undefined}
    >
      <div className="space-y-10">
        {examples.map((example) => (
          <ExamplePreview
            key={example.id}
            id={example.id}
            title={example.title}
            description={example.description}
            code={example.code}
            highlightedCodeDark={example.htmlDark}
            highlightedCodeLight={example.htmlLight}
            previewClassName={example.previewClassName}
            direction={example.direction}
          >
            <example.Demo />
          </ExamplePreview>
        ))}
      </div>
    </DocSection>
  );
}
