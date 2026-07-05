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

/**
 * API reference as a macOS System Settings-style grouped list: each row's name and
 * type share the top line, with description and default value below.
 */
export function PropsTable({ rows, className, ...props }: PropsTableProps) {
  return (
    <dl
      className={cn("divide-y divide-ui-border/50 rounded-xl border border-ui-border/60 bg-ui-card", className)}
      {...props}
    >
      {rows.map((row) => (
        <div key={row.name} className="space-y-2 px-5 py-4">
          <dt className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <code className="font-mono text-sm font-semibold text-ui-fg">{row.name}</code>
            <code className="shrink-0 rounded-md border border-ui-border/60 bg-ui-surface px-2 py-0.5 font-mono text-xs break-normal text-ui-muted">
              {row.type}
            </code>
          </dt>
          <dd className="space-y-2">
            <p className="text-sm leading-relaxed text-ui-muted">{row.description}</p>
            {row.default ? (
              <p className="flex items-center gap-1.5 text-xs text-ui-muted/70">
                Default
                <code className="rounded-md bg-ui-brand/10 px-1.5 py-0.5 font-mono text-ui-brand">{row.default}</code>
              </p>
            ) : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}
