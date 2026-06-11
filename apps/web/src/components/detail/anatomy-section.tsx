import { DocSection } from "#/components/detail/doc-section";
import { CodeBlock } from "#/components/shared/code-block";

interface AnatomySectionProps {
  readonly code: string;
  readonly highlightedCode: string;
}

/** The "Anatomy" section: the composition skeleton shown verbatim. */
export function AnatomySection({ code, highlightedCode }: AnatomySectionProps) {
  return (
    <DocSection
      id="anatomy"
      title="Anatomy"
      description="How the parts compose. Copy this skeleton and fill in the slots."
    >
      <div className="overflow-hidden rounded-2xl border border-ui-border">
        <CodeBlock code={code} highlightedCode={highlightedCode} />
      </div>
    </DocSection>
  );
}
