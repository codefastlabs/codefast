import { CheckIcon, XIcon } from "lucide-react";
import type { ComponentProps } from "react";

import { DocSection } from "#/components/detail/doc-section";

interface GuidelinesSectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  readonly do?: ReadonlyArray<string> | undefined;
  readonly dont?: ReadonlyArray<string> | undefined;
}

/** The "Guidelines" section: paired do / don't usage conventions. */
export function GuidelinesSection({ do: dos, dont: donts, ...props }: GuidelinesSectionProps) {
  return (
    <DocSection
      id="guidelines"
      title="Guidelines"
      description="Conventions that keep usage consistent across an app."
      {...props}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {dos?.length ? (
          <div className="rounded-2xl border border-ui-border/60 bg-ui-surface p-5">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ui-fg">
              <CheckIcon className="size-4 text-emerald-500" />
              Do
            </p>
            <ul className="space-y-2.5">
              {dos.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-ui-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {donts?.length ? (
          <div className="rounded-2xl border border-ui-border/60 bg-ui-surface p-5">
            <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-ui-fg">
              <XIcon className="size-4 text-rose-500" />
              Don’t
            </p>
            <ul className="space-y-2.5">
              {donts.map((item) => (
                <li key={item} className="text-sm leading-relaxed text-ui-muted">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </DocSection>
  );
}
