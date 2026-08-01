import { cn } from "@codefast/ui/lib/utils";
import type { ComponentProps, ReactElement } from "react";

import type { NodeDetails } from "#/features/di/lib/node-details";

interface NodeDetailsPanelProps extends ComponentProps<"aside"> {
  details: NodeDetails;
  onClose: () => void;
}

/** The selected binding, spelled out: what it is, what it needs, and who needs it. */
export function NodeDetailsPanel({ details, onClose, className, ...props }: NodeDetailsPanelProps): ReactElement {
  return (
    <aside
      className={cn("w-60 shrink-0 overflow-auto rounded-md border border-border bg-card p-3 text-xs", className)}
      {...props}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium text-foreground">{details.label}</span>
        <button
          aria-label="Close details"
          className="text-muted-foreground hover:text-foreground"
          onClick={onClose}
          type="button"
        >
          ✕
        </button>
      </div>
      <dl className="mt-2 space-y-1 text-muted-foreground">
        <div className="flex justify-between gap-2">
          <dt>kind</dt>
          <dd className="font-mono">{details.kind}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>scope</dt>
          <dd className="font-mono">{details.scope}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt>lifetime</dt>
          <dd className="font-mono">{details.lifetime}</dd>
        </div>
      </dl>
      {details.dependsOn.length > 0 && (
        <div className="mt-2">
          <p className="font-medium text-foreground">depends on</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {details.dependsOn.map((dependency, index) => (
              <li key={`${dependency.label}-${String(index)}`}>
                {dependency.label}
                {dependency.note !== undefined && <span className="opacity-70"> · {dependency.note}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
      {details.usedBy.length > 0 && (
        <div className="mt-2">
          <p className="font-medium text-foreground">used by</p>
          <ul className="mt-1 space-y-0.5 text-muted-foreground">
            {details.usedBy.map((consumer, index) => (
              <li key={`${consumer}-${String(index)}`}>{consumer}</li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}
