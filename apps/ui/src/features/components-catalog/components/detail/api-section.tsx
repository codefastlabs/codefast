import type { ComponentProps } from "react";

import { DocSection } from "#/features/components-catalog/components/detail/doc-section";
import { PropsTable } from "#/features/components-catalog/components/detail/props-table";
import type { ApiGroup } from "#/registry/_core/types";

interface ApiSectionProps extends Omit<ComponentProps<typeof DocSection>, "id" | "title" | "children"> {
  readonly groups: ReadonlyArray<ApiGroup>;
}

/** The "API reference" section: one props table per sub-component. */
export function ApiSection({ groups, ...props }: ApiSectionProps) {
  return (
    <DocSection
      id="api"
      title="API reference"
      description="Props for each part of the component. All native element props are also forwarded."
      {...props}
    >
      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.name}>
            <h3 className="mb-1 font-mono text-sm font-semibold text-ui-fg">{group.name}</h3>
            {group.description ? (
              <p className="mb-3 text-sm leading-relaxed text-ui-muted">{group.description}</p>
            ) : (
              <div className="mb-3" />
            )}
            <PropsTable rows={group.props} />
          </div>
        ))}
      </div>
    </DocSection>
  );
}
