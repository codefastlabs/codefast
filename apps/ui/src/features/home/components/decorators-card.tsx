import type { ComponentProps } from "react";

const DECORATORS = ["@injectable", "inject", "optional", "injectAll", "@postConstruct", "@preDestroy"];

type DecoratorsCardProps = Omit<ComponentProps<"article">, "children">;

/** Native decorators: dependencies declared where they are consumed, with nothing reflected at runtime. */
export function DecoratorsCard(props: DecoratorsCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-ui-border/60 bg-ui-card p-6" {...props}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-ui-brand tabular-nums">02</span>
        <h3 className="text-base font-semibold text-ui-fg">Native Stage 3 decorators</h3>
      </div>
      <p className="text-sm leading-relaxed text-ui-muted">
        Six decorators declare dependencies and lifecycle explicitly, so the container never reads a type at runtime. No
        reflect-metadata, no experimentalDecorators, and the same code runs in Node and in this browser tab.
      </p>
      <ul className="flex flex-wrap gap-2" aria-label="Decorators">
        {DECORATORS.map((name) => (
          <li key={name}>
            <code className="inline-flex rounded-full border border-ui-border/60 bg-ui-surface px-3 py-1 font-mono text-xs text-ui-fg">
              {name}
            </code>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-sm leading-relaxed text-ui-muted">
        This page compiles them with the standard decorators transform; the same code runs unchanged once browsers ship
        them.
      </p>
    </article>
  );
}
