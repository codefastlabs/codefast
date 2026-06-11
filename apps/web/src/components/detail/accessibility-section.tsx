import { CheckIcon } from "lucide-react";

import { DocSection } from "#/components/detail/doc-section";
import type { KeyRow } from "#/components/detail/keyboard-table";
import { KeyboardTable } from "#/components/detail/keyboard-table";

interface AccessibilitySectionProps {
  readonly keyboard?: ReadonlyArray<KeyRow> | undefined;
  readonly notes?: ReadonlyArray<string> | undefined;
}

/** The "Accessibility" section: keyboard map plus screen-reader notes. */
export function AccessibilitySection({ keyboard, notes }: AccessibilitySectionProps) {
  return (
    <DocSection
      id="accessibility"
      title="Accessibility"
      description="Built to be keyboard-navigable and screen-reader friendly out of the box."
    >
      <div className="space-y-6">
        {keyboard?.length ? <KeyboardTable rows={keyboard} /> : null}
        {notes?.length ? (
          <ul className="space-y-2">
            {notes.map((note) => (
              <li key={note} className="flex gap-2.5 text-sm leading-relaxed text-ui-muted">
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-ui-brand" />
                <span>{note}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </DocSection>
  );
}
