import type { ComponentProps } from "react";

import { DocSection } from "#/components/detail/doc-section";
import { anatomyToRows } from "#/lib/anatomy";
import type { AnatomyNode } from "#/registry/_core/types";

interface AnatomySectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  readonly nodes: ReadonlyArray<AnatomyNode>;
}

/** The "Anatomy" section: the component's parts drawn as a nesting tree. */
export function AnatomySection({ nodes, ...props }: AnatomySectionProps) {
  const rows = anatomyToRows(nodes);

  return (
    <DocSection
      id="anatomy"
      title="Anatomy"
      description="How the parts nest — every slot the component exposes, in composition order."
      {...props}
    >
      <div className="overflow-x-auto rounded-2xl border border-ui-border/60 bg-ui-surface p-5 font-mono text-sm leading-relaxed">
        {rows.map((row) => (
          <div key={row.prefix + row.name} className="whitespace-pre">
            <span className="text-ui-muted/60">{row.prefix}</span>
            <span className="text-ui-fg">{row.name}</span>
          </div>
        ))}
      </div>
    </DocSection>
  );
}
