import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps } from "react";

export interface PropRow {
  readonly name: string;
  readonly type: string;
  readonly default?: string;
  readonly description: string;
}

interface PropsTableProps extends ComponentProps<"dl"> {
  readonly rows: ReadonlyArray<PropRow>;
}

/** Stacks a union type one member per line so long unions read cleanly instead of breaking mid-word. */
function TypeValue({ type }: { readonly type: string }) {
  const members = type.split(" | ");

  if (members.length === 1) {
    return <span className="break-normal">{type}</span>;
  }

  return (
    <span className="flex flex-col gap-y-0.5">
      {members.map((member, index) => (
        <span key={member} className="break-normal whitespace-nowrap">
          {member}
          {index < members.length - 1 ? <span className="text-ui-muted/50"> |</span> : null}
        </span>
      ))}
    </span>
  );
}

/**
 * API reference as an Apple-style definition list: prop name and type read on the left,
 * description and default on the right, separated by hairlines with generous spacing.
 */
export function PropsTable({ rows, className, ...props }: PropsTableProps) {
  return (
    <dl className={cn("divide-y divide-ui-border/50 rounded-2xl border border-ui-border/60", className)} {...props}>
      {rows.map((row) => (
        <div key={row.name} className="grid gap-x-10 gap-y-3 px-5 py-5 sm:grid-cols-[minmax(0,13rem)_1fr]">
          <dt className="space-y-2">
            <code className="font-mono text-sm font-semibold text-ui-brand">{row.name}</code>
            <p className="font-mono text-xs leading-relaxed text-ui-fg/70">
              <TypeValue type={row.type} />
            </p>
          </dt>
          <dd className="space-y-3">
            <p className="text-sm leading-relaxed text-ui-muted">{row.description}</p>
            {row.default ? (
              <p className="flex items-center gap-x-2 text-xs text-ui-muted">
                Default
                <code className="rounded-md border border-ui-border/60 bg-ui-surface px-1.5 py-0.5 font-mono text-ui-fg">
                  {row.default}
                </code>
              </p>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
