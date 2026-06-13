import { ComponentCard } from "#/components/showcase/component-card";
import type { ComponentGroup } from "#/components/showcase/groups";

/** A titled band with a count badge and the responsive card grid. */
export function GroupSection({ group }: { group: ComponentGroup }) {
  return (
    <section id={group.id} className="mb-16 scroll-mt-28">
      <div className="mb-6 flex items-end justify-between gap-2 border-b border-ui-border bg-ui-bg/75 pt-3 pb-4 backdrop-blur-lg lg:sticky lg:top-12 lg:z-20">
        <h2 className="text-2xl leading-none font-bold tracking-tighter text-ui-fg">{group.label}</h2>
        <span className="w-fit shrink-0 rounded-full border border-ui-border bg-ui-surface px-2.5 py-1 text-xs font-semibold text-ui-muted tabular-nums">
          {group.items.length} components
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {group.items.map((component) => (
          <ComponentCard key={component.slug} component={component} />
        ))}
      </div>
    </section>
  );
}
