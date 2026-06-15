import { DocSection } from "#/components/detail/doc-section";
import { CodeBlock } from "#/components/shared/code-block";

interface AnatomySectionProps {
  readonly code: string;
  readonly highlightedCodeDark: string;
  readonly highlightedCodeLight: string;
}

/** The "Anatomy" section: the composition skeleton shown verbatim. */
export function AnatomySection({ code, highlightedCodeDark, highlightedCodeLight }: AnatomySectionProps) {
  return (
    <DocSection
      id="anatomy"
      title="Anatomy"
      description="How the parts compose. Copy this skeleton and fill in the slots."
    >
      <div className="overflow-hidden rounded-2xl border border-ui-border/60">
        <CodeBlock code={code} highlightedCodeDark={highlightedCodeDark} highlightedCodeLight={highlightedCodeLight} />
      </div>
    </DocSection>
  );
}
