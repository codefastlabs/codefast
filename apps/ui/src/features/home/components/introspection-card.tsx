import type { ComponentProps } from "react";

import { createShop } from "#/features/home/demos/shop";

const RENDERERS = ["DOT", "Mermaid", "Cytoscape", "React Flow"];

// inspect() reads bindings only, so the snapshot is the same on the server and in the browser.
const SNAPSHOT = createShop().container.inspect();

type IntrospectionCardProps = Omit<ComponentProps<"article">, "children">;

/** Modules and introspection: the demo container's own bindings, read back through inspect(). */
export function IntrospectionCard(props: IntrospectionCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-ui-border/60 bg-ui-card p-6" {...props}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-sm text-ui-brand tabular-nums">04</span>
        <h3 className="text-base font-semibold text-ui-fg">Modules and introspection</h3>
      </div>
      <p className="text-sm leading-relaxed text-ui-muted">
        Bundle bindings into reusable, ref-counted modules. Ask any container what it holds with inspect(), or hand its
        dependency graph to a renderer.
      </p>
      <div className="overflow-hidden rounded-xl border border-ui-border/60">
        <table className="w-full font-mono text-xs">
          <caption className="sr-only">The demo container&rsquo;s bindings</caption>
          <thead className="bg-ui-surface text-start text-ui-muted">
            <tr>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                token
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                kind
              </th>
              <th scope="col" className="px-3 py-2 text-start font-medium">
                scope
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ui-border/60 text-ui-fg">
            {SNAPSHOT.ownBindings.map((binding) => (
              <tr key={`${binding.tokenName}-${binding.id}`}>
                <td className="px-3 py-1.5">{binding.tokenName}</td>
                <td className="px-3 py-1.5 text-ui-muted">{binding.kind}</td>
                <td className="px-3 py-1.5 text-ui-muted">{binding.scope}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="mt-auto flex flex-wrap gap-2" aria-label="Graph renderers">
        {RENDERERS.map((name) => (
          <li key={name}>
            <span className="inline-flex rounded-full border border-ui-border/60 bg-ui-surface px-3 py-1 text-xs text-ui-fg">
              {name}
            </span>
          </li>
        ))}
      </ul>
    </article>
  );
}
