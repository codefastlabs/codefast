import type { ComponentProps } from "react";

import { DocSection } from "#/components/detail/doc-section";
import { CodeBlock } from "#/components/shared/code-block";
import { CopyButton } from "#/components/shared/copy-button";

interface AnatomySectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  readonly code: string;
  readonly highlightedCodeDark: string;
  readonly highlightedCodeLight: string;
}

/** The "Anatomy" section: the composition skeleton shown verbatim. */
export function AnatomySection({ code, highlightedCodeDark, highlightedCodeLight, ...props }: AnatomySectionProps) {
  return (
    <DocSection
      id="anatomy"
      title="Anatomy"
      description="How the parts compose. Copy this skeleton and fill in the slots."
      {...props}
    >
      <div className="relative overflow-hidden rounded-2xl border border-ui-border/60">
        <CopyButton value={code} className="absolute inset-e-3 top-3 z-10" />
        <CodeBlock highlightedCodeDark={highlightedCodeDark} highlightedCodeLight={highlightedCodeLight} />
      </div>
    </DocSection>
  );
}
