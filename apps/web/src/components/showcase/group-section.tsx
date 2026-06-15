import { cn } from "@codefast/ui/lib/utils";

import { ComponentCard } from "#/components/showcase/component-card";
import type { ComponentGroup } from "#/components/showcase/groups";
import { SCROLL_MT_GALLERY, STICKY_OFFSET_HEADER } from "#/lib/layout";

/** A titled band with a count badge and the responsive card grid. */
export function GroupSection({ group }: { group: ComponentGroup }) {
  const titleId = `${group.id}-title`;

  return (
    <section id={group.id} aria-labelledby={titleId} className={cn("mb-16", SCROLL_MT_GALLERY)}>
      <div
        className={cn(
          "mb-6 flex items-end justify-between gap-2 border-b border-ui-border/60 bg-ui-bg/75 pt-3 pb-4 backdrop-blur-lg backdrop-saturate-150 lg:sticky lg:z-20",
          STICKY_OFFSET_HEADER,
        )}
      >
        <h2 id={titleId} className="text-2xl leading-none font-bold tracking-tighter text-ui-fg">
          {group.label}
        </h2>
        <span className="w-fit shrink-0 rounded-full border border-ui-border/60 bg-ui-surface px-2.5 py-1 text-xs font-semibold text-ui-muted tabular-nums">
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
