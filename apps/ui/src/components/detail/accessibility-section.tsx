import { CheckIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DocSection } from "#/components/detail/doc-section";
import type { KeyRow } from "#/components/detail/keyboard-table";
import { KeyboardTable } from "#/components/detail/keyboard-table";
import type { AccessibilityNote } from "#/registry/types";

interface AccessibilitySectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  readonly keyboard?: ReadonlyArray<KeyRow> | undefined;
  readonly notes?: ReadonlyArray<string | AccessibilityNote> | undefined;
}

/** The "Accessibility" section: keyboard map plus screen-reader notes. */
export function AccessibilitySection({ keyboard, notes, ...props }: AccessibilitySectionProps) {
  return (
    <DocSection
      description="Built to be keyboard-navigable and screen-reader friendly out of the box."
      id="accessibility"
      title="Accessibility"
      {...props}
    >
      <div className="space-y-6">
        {keyboard?.length ? <KeyboardTable rows={keyboard} /> : null}
        {notes?.length ? (
          <ul className="space-y-3">
            {notes.map((note) => {
              const isTitled = typeof note !== "string";

              return (
                <li key={isTitled ? note.title : note} className="flex gap-2.5 text-sm leading-relaxed text-ui-muted">
                  <CheckIcon className="mt-0.5 size-4 shrink-0 text-ui-brand" />
                  <span>
                    {isTitled ? <span className="font-semibold text-ui-fg">{note.title}: </span> : null}
                    {isTitled ? note.description : note}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </DocSection>
  );
}
