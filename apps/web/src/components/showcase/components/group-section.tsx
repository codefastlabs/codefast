import type { ComponentGroup } from "#/data/component-groups";
import type { HighlightedCodes } from "#/components/showcase/types";
import { ComponentCard } from "#/components/showcase/components/component-card";

/** A titled band with a count badge and the responsive card grid. */
export function GroupSection({ group, hl }: { group: ComponentGroup; hl: HighlightedCodes }) {
  return (
    <section id={group.id} className="mb-16 scroll-mt-28">
      <div className="mb-6 flex flex-col gap-2 border-b border-ui-border pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl leading-none font-bold tracking-tighter text-ui-fg">
            {group.label}
          </h2>
          {group.description ? (
            <p className="mt-1.5 max-w-xl text-sm leading-6 text-ui-muted">{group.description}</p>
          ) : null}
        </div>
        <span className="w-fit shrink-0 rounded-full border border-ui-border bg-ui-surface px-2.5 py-1 text-xs font-semibold text-ui-muted tabular-nums">
          {group.items.length} components
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {group.items.map((component) => (
          <ComponentCard
            key={component.slug}
            component={component}
            highlighted={hl[component.slug] ?? ""}
          />
        ))}
      </div>
    </section>
  );
}
