import type { DocExample } from "#/components/examples/docs/types";
import { DocSection } from "#/components/docs/doc-section";
import { ExamplePreview } from "#/components/docs/example-preview";

interface ExamplesSectionProps {
  readonly examples: ReadonlyArray<DocExample>;
  /** Highlighted Shiki HTML keyed by example id. */
  readonly highlighted: Record<string, string>;
  /** Show the generic hint line when the page has no rich doc. */
  readonly showHint: boolean;
}

/** The "Examples" section: a live preview + copy-ready source per example. */
export function ExamplesSection({ examples, highlighted, showHint }: ExamplesSectionProps) {
  return (
    <DocSection
      id="examples"
      title="Examples"
      description={
        showHint
          ? "Live preview and copy-ready source. Explore more variants in your own app."
          : undefined
      }
    >
      <div className="space-y-10">
        {examples.map((example) => (
          <ExamplePreview
            key={example.id}
            id={example.id}
            title={example.title}
            description={example.description}
            code={example.code}
            highlightedCode={highlighted[example.id] ?? ""}
            previewClassName={example.previewClassName}
          >
            <example.Demo />
          </ExamplePreview>
        ))}
      </div>
    </DocSection>
  );
}
